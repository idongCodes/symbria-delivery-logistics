'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';

async function sendFacilityNotification(action: 'Added' | 'Edited' | 'Deleted', details: string) {
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
        <h2 style="color: #9333ea; border-bottom: 2px solid #9333ea; padding-bottom: 10px;">
          System Alert: Facility ${action}
        </h2>
        <p>An administrator has <strong>${action.toLowerCase()}</strong> a facility in the Rx Delivery Logistics System.</p>
        
        <table width="100%" style="background:#f8fafc; padding:15px; border-radius:5px; margin-bottom:20px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="font-size: 16px; line-height: 1.6;">
              ${details}
            </td>
          </tr>
        </table>
        
        <p style="margin-top:30px; font-size:12px; color:#999; text-align:center;">
          Automated message from Rx Delivery Logistics System.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Rx Delivery Logistics Alerts" <no-reply@rxdeliverylogistics.com>',
      to: 'idongesit_essien@ymail.com', // Admin email
      subject: `System Alert: Facility ${action}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Failed to send facility notification email:", error);
  }
}

export async function deleteFacility(facilityId: number) {
  try {
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facility) {
      return { success: false, error: 'Facility not found' };
    }

    await prisma.facility.delete({
      where: { id: facilityId }
    });
    
    await sendFacilityNotification('Deleted', `<strong>Facility Name:</strong> ${facility.name}<br/><strong>Action:</strong> Facility was permanently deleted from the database.`);
    
    revalidatePath('/trip-log');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete facility ${facilityId}:`, error);
    return { success: false, error: 'Failed to delete facility' };
  }
}

export async function updateFacility(facilityId: number, data: { name: string, address: string, phone: string }) {
  try {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId }
    });

    if (!facility) {
      return { success: false, error: 'Facility not found' };
    }

    await prisma.facility.update({
      where: { id: facilityId },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
      }
    });
    
    await sendFacilityNotification('Edited', `<strong>Facility ID:</strong> ${facilityId}<br/><strong>Name:</strong> ${data.name}<br/><strong>Address:</strong> ${data.address}<br/><strong>Phone:</strong> ${data.phone}<br/><strong>Details:</strong> Facility details were updated.`);
    
    revalidatePath('/trip-log');
    return { success: true };
  } catch (error) {
    console.error(`Failed to update facility ${facilityId}:`, error);
    return { success: false, error: 'Failed to update facility' };
  }
}

export async function createFacility(data: { name: string, address: string, phone: string }) {
  try {
    const facility = await prisma.facility.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
      }
    });
    
    await sendFacilityNotification('Added', `<strong>New Facility Name:</strong> ${data.name}<br/><strong>Address:</strong> ${data.address}<br/><strong>Phone:</strong> ${data.phone}<br/><strong>Details:</strong> A new facility was successfully added to the database.`);
    
    revalidatePath('/trip-log');
    return { success: true, facility };
  } catch (error) {
    console.error(`Failed to create facility:`, error);
    return { success: false, error: 'Failed to create facility' };
  }
}
