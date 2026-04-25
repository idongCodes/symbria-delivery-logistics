'use server'

import { prisma } from '@/lib/prisma';

export async function startBreak(data: { firstName: string, lastName: string, duration: number }) {
  try {
    const breakLog = await prisma.breakLog.create({
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        duration: data.duration,
        status: "In Progress",
      },
    });
    return { success: true, breakLogId: breakLog.id };
  } catch (error) {
    console.error("Error starting break:", error);
    return { success: false, error: "Failed to start break" };
  }
}

export async function endBreak(breakLogId: string) {
  try {
    const breakLog = await prisma.breakLog.update({
      where: { id: breakLogId },
      data: {
        status: "Completed",
        end_time: new Date(),
      },
    });
    return { success: true, breakLog };
  } catch (error) {
    console.error("Error ending break:", error);
    return { success: false, error: "Failed to end break" };
  }
}
