#!/usr/bin/env node
// Purges the entire Cloudflare cache for dangerthirdrail.com.
// Requires CF_API_TOKEN with Zone > Cache Purge permission.

const ZONE_ID = 'be0134d4f3c4118ce5340fd8c6953e07';

const token = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  console.error('CF_API_TOKEN not set. Source ~/.secrets first.');
  process.exit(1);
}

const res = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purge_everything: true }),
  },
);

const data = await res.json();
if (data.success) {
  console.log('Cache purged.');
} else {
  console.error('Failed:', data.errors);
  process.exit(1);
}
