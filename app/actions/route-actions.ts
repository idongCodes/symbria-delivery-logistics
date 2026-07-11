'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteRoute(routeId: number) {
  try {
    await prisma.route.delete({
      where: { id: routeId }
    });
    
    // Revalidate the dashboard page to refresh the route list
    revalidatePath('/trip-log');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete route ${routeId}:`, error);
    return { success: false, error: 'Failed to delete route' };
  }
}
