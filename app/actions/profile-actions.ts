'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to format phone numbers or handle them, optional

export async function createProfile(data: { first_name: string, last_name: string, email: string, phone: string, role: string, job_title: string }) {
  try {
    const newProfile = await prisma.profile.create({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        job_title: data.job_title,
      }
    });
    revalidatePath('/trip-log');
    revalidatePath('/contacts');
    return { success: true, profile: newProfile };
  } catch (error) {
    console.error("Failed to create profile:", error);
    return { success: false, error: "Failed to create profile" };
  }
}

export async function updateProfile(id: string, data: { first_name: string, last_name: string, email: string, phone: string, role: string, job_title: string }) {
  try {
    const updatedProfile = await prisma.profile.update({
      where: { id },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        job_title: data.job_title,
      }
    });
    revalidatePath('/trip-log');
    revalidatePath('/contacts');
    return { success: true, profile: updatedProfile };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function deleteProfile(id: string) {
  try {
    await prisma.profile.delete({
      where: { id }
    });
    revalidatePath('/trip-log');
    revalidatePath('/contacts');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete profile:", error);
    return { success: false, error: "Failed to delete profile" };
  }
}
