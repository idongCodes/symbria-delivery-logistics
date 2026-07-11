// app/admin/feedback/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getFeedback() {
  return await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteFeedback(ids: string[]) {
  await prisma.feedback.deleteMany({
    where: {
      id: { in: ids },
    },
  });
  revalidatePath('/trip-log'); // Refresh the page automatically
}

export async function markAsRead(ids: string[], isRead: boolean) {
  await prisma.feedback.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      read: isRead,
    },
  });
  revalidatePath('/trip-log');
}
