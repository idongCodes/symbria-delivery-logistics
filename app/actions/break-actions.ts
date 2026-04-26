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

export async function getBreakLogs() {
  try {
    const breakLogs = await prisma.breakLog.findMany({
      orderBy: { start_time: 'desc' },
    });
    return { success: true, breakLogs };
  } catch (error) {
    console.error("Error fetching break logs:", error);
    return { success: false, error: "Failed to fetch break logs", breakLogs: [] };
  }
}

export async function getUserBreaks(firstName: string, lastName: string) {
  try {
    const breakLogs = await prisma.breakLog.findMany({
      where: {
        first_name: { equals: firstName, mode: 'insensitive' },
        last_name: { equals: lastName, mode: 'insensitive' },
      },
      orderBy: { start_time: 'desc' },
    });
    return { success: true, breakLogs };
  } catch (error) {
    console.error("Error fetching user breaks:", error);
    return { success: false, error: "Failed to fetch user breaks", breakLogs: [] };
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

export async function deleteBreakLog(breakLogId: string) {
  try {
    await prisma.breakLog.delete({
      where: { id: breakLogId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting break:", error);
    return { success: false, error: "Failed to delete break" };
  }
}

export async function updateBreakLog(breakLogId: string, data: { start_time?: string, end_time?: string | null }) {
  try {
    const updateData: any = {};
    if (data.start_time !== undefined) {
      updateData.start_time = new Date(data.start_time);
    }
    // allow null for end_time
    if (data.end_time !== undefined) {
      updateData.end_time = data.end_time ? new Date(data.end_time) : null;
      if (data.end_time === null) {
         updateData.status = "In Progress";
      } else if (data.end_time !== null) {
         updateData.status = "Completed";
      }
    }

    const breakLog = await prisma.breakLog.update({
      where: { id: breakLogId },
      data: updateData,
    });
    return { success: true, breakLog };
  } catch (error) {
    console.error("Error updating break:", error);
    return { success: false, error: "Failed to update break" };
  }
}


