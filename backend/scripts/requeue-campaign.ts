import { campaignService } from '../src/services/campaign.service.js';
import { prisma } from '../src/config/database.js';

const campaignId = process.argv[2];
if (!campaignId) {
  console.error('Usage: npx tsx scripts/requeue-campaign.ts <campaign-id>');
  process.exit(1);
}

async function main() {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  await campaignService.activateCampaign(campaignId);
  const pending = await prisma.emailQueueItem.count({
    where: { campaignId, status: 'PENDING' },
  });
  console.log(JSON.stringify({ campaignId, status: campaign.status, pendingRequeued: pending }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
