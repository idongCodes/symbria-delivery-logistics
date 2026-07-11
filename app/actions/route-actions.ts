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

export async function updateRoute(routeId: number, name: string) {
  try {
    const route = await prisma.route.findUnique({
      where: { id: routeId }
    });

    if (!route) {
      return { success: false, error: 'Route not found' };
    }

    const oldName = route.name;

    await prisma.$transaction([
      prisma.route.update({
        where: { id: routeId },
        data: { name }
      }),
      prisma.tripLog.updateMany({
        where: { route_id: oldName },
        data: { route_id: name }
      })
    ]);
    
    // Revalidate the dashboard page to refresh the route list
    revalidatePath('/trip-log');
    return { success: true };
  } catch (error) {
    console.error(`Failed to update route ${routeId}:`, error);
    return { success: false, error: 'Failed to update route' };
  }
}

export async function createRoute(name: string) {
  try {
    const route = await prisma.route.create({
      data: { name }
    });
    
    revalidatePath('/trip-log');
    revalidatePath('/contacts'); // Just in case contacts page needs revalidation
    return { success: true, route };
  } catch (error) {
    console.error(`Failed to create route:`, error);
    return { success: false, error: 'Failed to create route' };
  }
}
