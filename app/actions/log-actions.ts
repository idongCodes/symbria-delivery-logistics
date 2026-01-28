'use server'

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function generateShareToken(logId: number) {
  // 1. Fetch log details to check existence and get data for custom token
  const log = await prisma.tripLog.findUnique({
    where: { id: logId },
    select: { 
      share_token: true,
      trip_type: true,
      created_at: true
    }
  });

  if (log?.share_token) {
    return log.share_token;
  }

  if (!log) {
    throw new Error("Log not found");
  }

  // 2. Generate new custom token
  // Format: TripType-YYYY-MM-DD-RandomSuffix
  const datePart = new Date(log.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
  const typePart = log.trip_type.replace(/\s+/g, '-'); // Replace spaces with dashes, e.g. "Pre-Trip"
  const randomSuffix = randomUUID().split('-')[0]; // Use first 8 chars of UUID for uniqueness
  
  const token = `${typePart}-${datePart}-${randomSuffix}`;
  
  await prisma.tripLog.update({
    where: { id: logId },
    data: { share_token: token }
  });

  return token;
}