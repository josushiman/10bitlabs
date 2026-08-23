#!/usr/bin/env bash
#
# Verify the domain cutover from the outside, the way a visitor and a mail
# server see it.
#
# The spec rules out a Playwright test for DNS and mail — neither is reachable
# from the browser seam. This script is what stands in its place: the manual
# checklist, executable, so "the cutover is done" is a command rather than a
# memory. It changes nothing; it only asks questions.
#
#   ./scripts/verify-cutover.sh [domain]
#
# Exits non-zero if any check fails, so it can gate the wizard.

set -uo pipefail

DOMAIN="${1:-10bitlabs.co.uk}"
PREVIEW_HOST="${PREVIEW_HOST:-10bitlabs-site.tim-mus.workers.dev}"

if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && [[ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]]; then
  BOLD=$(tput bold); DIM=$(tput dim); RESET=$(tput sgr0)
  GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3); RED=$(tput setaf 1)
else
  BOLD=""; DIM=""; RESET=""; GREEN=""; YELLOW=""; RED=""
fi

for tool in dig curl; do
  command -v "$tool" >/dev/null 2>&1 || { echo "$tool is required" >&2; exit 1; }
done

FAILURES=0

pass() { printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
fail() { printf '  %s✗%s %s\n' "$RED" "$RESET" "$1"; FAILURES=$((FAILURES + 1)); }
info() { printf '    %s%s%s\n' "$DIM" "$1" "$RESET"; }
warn() { printf '  %s⚠%s %s\n' "$YELLOW" "$RESET" "$1"; }
section() { printf '\n%s%s%s\n' "$BOLD" "$1" "$RESET"; }

# Ask the zone's own nameservers, not a local resolver: mid-cutover a cached
# answer is exactly the thing that makes a broken zone look fine.
NAMESERVERS=$(dig +short NS "$DOMAIN" | sed 's/\.$//' | sort | tr '\n' ' ')
AUTH=$(printf '%s' "$NAMESERVERS" | awk '{ print $1 }')

# zone_answer NAME TYPE — the zone's own answer, falling back to a public
# resolver only when the domain has no delegation left to ask.
zone_answer() { dig +short "@${AUTH:-1.1.1.1}" "$2" "$1"; }

# headers URL — response headers, following no redirects, lowercased names.
headers() { curl -sS -o /dev/null -D - --max-time 20 "$1" 2>/dev/null | tr -d '\r' | tr 'A-Z' 'a-z'; }

section "Delegation"
if [[ "$NAMESERVERS" == *ns.cloudflare.com* ]]; then
  pass "nameservers are Cloudflare's — a Custom Domain binding is possible"
  info "$NAMESERVERS"
else
  fail "nameservers are not Cloudflare's, so the apex cannot bind to the Worker"
  info "${NAMESERVERS:-none}"
fi

section "Mail — the five iCloud records"

MX=$(zone_answer "$DOMAIN" MX | sort | tr '\n' ' ')
if [[ "$MX" == *"mx01.mail.icloud.com"* && "$MX" == *"mx02.mail.icloud.com"* ]]; then
  pass "both Apple mail exchangers are present"
  info "$MX"
else
  fail "Apple's mx01/mx02.mail.icloud.com are not both present — mail is not being delivered to iCloud"
  info "${MX:-none}"
fi

# Cloudflare Email Routing announces itself in the MX records. Its presence is
# how the withdrawn recommendation would show up if it were ever reinstated.
if [[ "$MX" == *"mx.cloudflare.net"* ]]; then
  fail "a Cloudflare Email Routing mail exchanger is present — delivery has been taken away from iCloud"
  info "Disable Email Routing in the Cloudflare dashboard and restore the Apple MX records."
else
  pass "no Cloudflare Email Routing mail exchanger — delivery still belongs to iCloud"
  info "This proves the records, not the dashboard switch: Email Routing can be"
  info "enabled but unconfigured and still leave the Apple records standing."
fi

SPF=$(zone_answer "$DOMAIN" TXT | grep -i 'v=spf1' || true)
if [[ "$SPF" == *"include:icloud.com"* ]]; then
  pass "the sender policy authorises iCloud"
  info "$SPF"
else
  fail "no SPF record including icloud.com — mail sent from the mailbox will fail sender checks"
  info "${SPF:-none}"
fi

APPLE=$(zone_answer "$DOMAIN" TXT | grep -i 'apple-domain' || true)
if [[ -n "$APPLE" ]]; then
  pass "Apple's domain verification record is present"
  info "$APPLE"
else
  fail "the apple-domain verification record is missing — iCloud will stop treating the domain as verified"
fi

# One DKIM key, not two. Apple publishes sig1 only; a sig2 lookup returns
# nothing and going looking for one wastes an afternoon.
DKIM_RAW=$(dig +noall +answer "@${AUTH:-1.1.1.1}" CNAME "sig1._domainkey.$DOMAIN")
DKIM_TARGET=$(zone_answer "sig1._domainkey.$DOMAIN" CNAME)
EXPECTED_DKIM="sig1.dkim.$DOMAIN.at.icloudmailadmin.com."
if [[ "$DKIM_TARGET" == "$EXPECTED_DKIM" ]]; then
  pass "the DKIM signing record points at Apple's key"
  info "$DKIM_TARGET"
elif [[ -n "$DKIM_TARGET" ]]; then
  fail "the DKIM signing record points somewhere unexpected"
  info "expected $EXPECTED_DKIM, got $DKIM_TARGET"
else
  fail "no DKIM signing record at sig1._domainkey.$DOMAIN"
fi

# Proxied, Cloudflare answers the DKIM name with its own addresses instead of
# following the CNAME. Mail still flows and SPF still passes, so nothing looks
# broken until a recipient checks the signature — which is why this is asserted
# rather than eyeballed.
if [[ -n "$DKIM_RAW" ]]; then
  pass "the DKIM record is served as a CNAME — it is DNS only, not proxied"
elif [[ -n "$(zone_answer "sig1._domainkey.$DOMAIN" A)" ]]; then
  fail "the DKIM name answers with addresses, not a CNAME — it is proxied, and the signature will not verify"
  info "Set sig1._domainkey to DNS only (grey cloud) in Cloudflare."
else
  fail "the DKIM name answers with neither a CNAME nor an address"
  info "Whatever is there is not a signing record, and outbound mail will not be signed."
fi

section "The site"

APEX_HEADERS=$(headers "https://$DOMAIN/")
APEX_STATUS=$(printf '%s' "$APEX_HEADERS" | head -n1)
if [[ "$APEX_STATUS" == *" 200"* ]]; then
  pass "the apex serves a page"
else
  fail "the apex does not serve a page"
  info "${APEX_STATUS:-no response}"
fi

if printf '%s' "$APEX_HEADERS" | grep -q 'content-security-policy'; then
  pass "the apex serves the site's own headers — it is the Worker, not a parked page"
else
  fail "no content security policy on the apex — whatever is answering is not this site"
fi

# The apex is the canonical hostname, so it is the one hostname that must NOT
# carry noindex. Everything else inherits it from dist/_headers. Only worth
# asserting once the apex is actually serving the site — an apex serving nothing
# also carries no X-Robots-Tag, and that is not a pass.
if [[ "$APEX_STATUS" == *" 200"* ]]; then
  if printf '%s' "$APEX_HEADERS" | grep -q 'x-robots-tag'; then
    fail "the apex serves X-Robots-Tag — the canonical hostname is telling search engines to ignore it"
  else
    pass "the apex carries no X-Robots-Tag — it is indexable and canonical"
  fi
fi

WWW_HEADERS=$(headers "https://www.$DOMAIN/")
WWW_STATUS=$(printf '%s' "$WWW_HEADERS" | head -n1)
WWW_LOCATION=$(printf '%s' "$WWW_HEADERS" | grep '^location:' | head -n1 | sed 's/^location: *//')
if [[ "$WWW_STATUS" == *" 301"* ]]; then
  pass "www returns a permanent redirect"
else
  fail "www does not return 301 — it returned '${WWW_STATUS:-no response}'"
fi
if [[ "$WWW_LOCATION" == "https://$DOMAIN/"* ]]; then
  pass "www redirects to the apex"
  info "$WWW_LOCATION"
else
  fail "www does not redirect to https://$DOMAIN/"
  info "${WWW_LOCATION:-no Location header}"
fi

PREVIEW_HEADERS=$(headers "https://$PREVIEW_HOST/")
if [[ -z "$PREVIEW_HEADERS" ]]; then
  warn "the preview host $PREVIEW_HOST did not respond — checked separately or not yet provisioned"
elif printf '%s' "$PREVIEW_HEADERS" | grep -q 'x-robots-tag: *noindex'; then
  pass "the preview host still serves noindex — it cannot compete with the apex in search"
else
  fail "$PREVIEW_HOST does not serve noindex — a preview copy of the site is indexable"
fi

section "Not checkable from here"
info "A message sent TO $DOMAIN arriving in the mailbox."
info "A message sent FROM the mailbox passing DKIM and SPF at the recipient."
info "Both are stages in ./scripts/cutover-domain.sh, and neither has a substitute."

printf '\n'
if (( FAILURES )); then
  printf '%s%s  %s check(s) failed%s\n\n' "$BOLD" "$RED" "$FAILURES" "$RESET"
  exit 1
fi
printf '%s%s  Everything checkable from outside is in order%s\n\n' "$BOLD" "$GREEN" "$RESET"
