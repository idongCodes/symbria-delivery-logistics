'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';

async function sendRouteNotification(action: 'Added' | 'Edited' | 'Deleted', details: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          System Alert: Route ${action}
        </h2>
        <p>An administrator has <strong>${action.toLowerCase()}</strong> a route in the Symbria Delivery Logistics System.</p>
        
        <table width="100%" style="background:#f8fafc; padding:15px; border-radius:5px; margin-bottom:20px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="font-size: 16px; line-height: 1.6;">
              ${details}
            </td>
          </tr>
        </table>
        
        <p style="margin-top:30px; font-size:12px; color:#999; text-align:center;">
          Automated message from Symbria Delivery Logistics System.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Symbria Logistics Alerts" <no-reply@symbria.com>',
      to: 'idongesit_essien@ymail.com', // Admin email
      subject: `System Alert: Route ${action}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Failed to send route notification email:", error);
  }
}

export async function deleteRoute(routeId: number) {
  try {
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      return { success: false, error: 'Route not found' };
    }

    await prisma.route.delete({
      where: { id: routeId }
    });
    
    await sendRouteNotification('Deleted', `<strong>Route Name:</strong> ${route.name}<br/><strong>Action:</strong> Route was permanently deleted from the database.`);
    
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
    
    await sendRouteNotification('Edited', `<strong>Route ID:</strong> ${routeId}<br/><strong>Old Name:</strong> ${oldName}<br/><strong>New Name:</strong> ${name}<br/><strong>Details:</strong> Route name was updated and all associated historical trip logs were seamlessly re-linked.`);
    
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
    
    await sendRouteNotification('Added', `<strong>New Route Name:</strong> ${name}<br/><strong>Details:</strong> A new route was successfully added to the database.`);
    
    revalidatePath('/trip-log');
    revalidatePath('/contacts'); // Just in case contacts page needs revalidation
    return { success: true, route };
  } catch (error) {
    console.error(`Failed to create route:`, error);
    return { success: false, error: 'Failed to create route' };
  }
}
