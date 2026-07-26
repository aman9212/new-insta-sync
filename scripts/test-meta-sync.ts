import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { fetchInstagramMetrics, syncAllActivePosts } from '../src/services/meta-sync.service';

async function main() {
  console.log('====================================================');
  console.log('🧪 Meta Graph API View Sync Engine Local Test Script');
  console.log('====================================================\n');

  const args = process.argv.slice(2);
  const mediaIdArg = args.find((a) => a.startsWith('--media-id='))?.split('=')[1];
  const isFullSync = args.includes('--full-sync');

  if (isFullSync) {
    console.log('🚀 Triggering full active Instagram post sync from Supabase DB...\n');
    try {
      const summary = await syncAllActivePosts();
      console.log('----------------------------------------------------');
      console.log('📊 SYNC BATCH SUMMARY RESULTS:');
      console.log(`- Total Posts Processed: ${summary.totalProcessed}`);
      console.log(`- Successful Syncs:     ${summary.successCount}`);
      console.log(`- Failed Syncs:         ${summary.failureCount}`);
      console.log(`- Execution Timestamp:  ${summary.timestamp}`);
      if (summary.errors.length > 0) {
        console.log('\n⚠️ Encountered Warnings / Errors:');
        summary.errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
      }
      console.log('----------------------------------------------------\n');
    } catch (err) {
      console.error('❌ Critical error during batch sync:', (err as Error).message);
    }
    return;
  }

  // Use provided CLI media-id or real Instagram media ID from user payload
  const testMediaId = mediaIdArg || '18271214179214433';
  const testAccessToken =
    process.env.META_USER_ACCESS_TOKEN || process.env.VITE_META_USER_ACCESS_TOKEN;

  console.log(`📡 Fetching single Instagram media metrics for ID: ${testMediaId}`);
  if (testAccessToken) {
    console.log(`🔑 Meta Access Token Loaded Successfully (${testAccessToken.slice(0, 10)}...${testAccessToken.slice(-6)})`);
  } else {
    console.log('⚠️ Notice: META_USER_ACCESS_TOKEN env var is not set in process.env. Executing test with graceful fallback verification...');
  }

  try {
    const metrics = await fetchInstagramMetrics(testMediaId, testAccessToken);
    console.log('\n----------------------------------------------------');
    console.log('📥 FETCHED METRICS RESPONSE:');
    console.log(`- Media ID:       ${metrics.mediaId}`);
    console.log(`- Raw Views:      ${metrics.raw_views}`);
    console.log(`- Raw Likes:      ${metrics.raw_likes}`);
    console.log(`- Comments Count: ${metrics.comments_count}`);
    console.log(`- Fetched At:     ${metrics.fetchedAt}`);
    if (metrics.error) {
      console.log(`- API Error:      ${metrics.error}`);
    } else {
      console.log(`- Status:         ✅ SUCCESS (Metrics Fetched Cleanly)`);
    }
    console.log('----------------------------------------------------\n');
  } catch (err) {
    console.error('❌ Error executing fetchInstagramMetrics:', (err as Error).message);
  }
}

main().catch((err) => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
