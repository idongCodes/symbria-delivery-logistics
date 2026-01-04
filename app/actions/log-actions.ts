'use server'

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function generateShareToken(logId: number) {
  // 1. Check if token already exists
  const log = await prisma.tripLog.findUnique({
    where: { id: logId },
    select: { share_token: true }
  });

  if (log?.share_token) {
    return log.share_token;
  }

  // 2. Generate new token
  const token = randomUUID();
  
  await prisma.tripLog.update({
    where: { id: logId },
    data: { share_token: token }
  });

  return token;
}