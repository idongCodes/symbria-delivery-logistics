import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      driver_name, 
      trip_type, 
      route_id, 
      odometer, 
      notes, 
      checklist, 
      images, 
      created_at,
      shareLink,
      isUpdate,
      changes
    } = body;

    // --- 0. Handle Update Email Branch ---
    if (isUpdate) {
      let changesHtml = "";
      if (changes && Array.isArray(changes) && changes.length > 0) {
        changesHtml = `
          <table width="100%" cellspacing="0" cellpadding="10" style="font-size: 14px; margin-top: 20px; border: 1px solid #e5e7eb; border-collapse: collapse;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="text-align:left; border: 1px solid #e5e7eb;">Field</th>
                <th style="text-align:left; border: 1px solid #e5e7eb;">Old Value</th>
                <th style="text-align:left; border: 1px solid #e5e7eb;">New Value</th>
              </tr>
            </thead>
            <tbody>
        `;
        changes.forEach((change: any) => {
          changesHtml += `
            <tr>
              <td style="border: 1px solid #e5e7eb;"><strong>${change.field}</strong></td>
              <td style="border: 1px solid #e5e7eb; color: #b91c1c; background: #fef2f2;">${String(change.old || 'N/A')}</td>
              <td style="border: 1px solid #e5e7eb; color: #15803d; background: #f0fdf4;">${String(change.new || 'N/A')}</td>
            </tr>
          `;
        });
        changesHtml += `
            </tbody>
          </table>
        `;
      } else {
        changesHtml = `<p>No fields were materially changed.</p>`;
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Trip Log Updated
          </h2>
          <p>A trip log was recently updated by <strong>${driver_name || 'Driver'}</strong>.</p>
          
          <table width="100%" style="background:#f8fafc; padding:15px; border-radius:5px; margin-bottom:20px;">
            <tr><td style="padding-bottom:5px;"><strong>Driver:</strong> ${driver_name || 'Unknown'}</td></tr>
            <tr><td style="padding-bottom:5px;"><strong>Type:</strong> <span style="background:${trip_type === 'Pre-Trip' ? '#dbeafe' : '#fef3c7'}; padding:2px 6px; border-radius:4px;">${trip_type}</span></td></tr>
            <tr><td style="padding-bottom:5px;"><strong>Route / Odo:</strong> ${route_id || 'N/A'} / ${odometer}</td></tr>
          </table>

          <h3 style="background:#f3f4f6; padding:10px;">Changed Fields</h3>
          ${changesHtml}

          <div style="margin-top: 30px; text-align: center;">
            <a href="${shareLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">View Updated Log</a>
          </div>
          
          <p style="margin-top:30px; font-size:12px; color:#999; text-align:center;">
            Automated message from Rx Delivery Logistics System.
          </p>
        </div>
      `;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Rx Delivery Logistics Alerts" <no-reply@rxdeliverylogistics.com>',
        to: 'idongesit_essien@ymail.com',
        subject: `UPDATE: Trip Log - ${driver_name} - ${trip_type}`,
        html: emailHtml,
      });

      return NextResponse.json({ success: true, message: "Update email sent successfully" }, { status: 200 });
    }

    // --- 1. Format Checklist for Email ---
    // We'll convert the JSON checklist into HTML table rows
    let checklistObj: Record<string, unknown> = {};
    try {
      if (typeof checklist === 'string') {
        checklistObj = JSON.parse(checklist);
      } else if (checklist && typeof checklist === 'object') {
        checklistObj = checklist as Record<string, unknown>;
      }
    } catch (e) {
      console.error("Error parsing checklist in email route:", e);
    }

    const scannerQs = ["Scanner Synchronized", "Clicked End Route", "Completely Logged off Scanner", "Scanner returned & plugged in"];
    const keyQs = ["Vehicle key returned to lockbox"];

    let checklistRows = "";
    let scannerRows = "";
    let keyRows = "";

    type MedReturn = {
      hadReturns: 'Yes' | 'No' | null;
      reason?: string;
      facilityPatient: string;
      handedToPharmacy: 'Yes' | 'No' | null;
      needsRefrigeration: 'Yes' | 'No' | null;
      placedInFridge: 'Yes' | 'No' | null;
    };
    
    if (checklistObj) {
      Object.entries(checklistObj).forEach(([key, value]) => {
        if (key.endsWith("_COMMENT") || key.includes("Tire Pressure") || key === "Tackle Boxes Included" || key === "Tackle Box Deliveries" || key === "Med Returns") return; // Skip specialized sections for main list
        
        const isScannerQ = scannerQs.includes(key);
        const isKeyQ = keyQs.includes(key);
        const stringValue = String(value);
        const commentKey = `${key}_COMMENT`;
        const comment = checklistObj[commentKey] ? `<br/><span style="color:red; font-size:12px;">⚠️ ${checklistObj[commentKey]}</span>` : "";
        
        // Style "No" or "Yes" (for damage) as bold/red if it's an issue
        // Assuming "No" is bad for safety checks, "Yes" is bad for damage checks
        const isDamageQ = key.includes("damage") || key.includes("Cracks");
        let statusStyle = "color:green; font-weight:bold;";
        
        if ((isDamageQ && stringValue === "Yes") || (!isDamageQ && stringValue === "No")) {
            statusStyle = "color:red; font-weight:bold;";
        }

        const rowHtml = `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${key}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; ${statusStyle}">${stringValue} ${comment}</td>
          </tr>
        `;

        if (isScannerQ) {
          scannerRows += rowHtml;
        } else if (isKeyQ) {
          keyRows += rowHtml;
        } else {
          checklistRows += rowHtml;
        }
      });
    }

    // --- Format Scanner Section ---
    let scannerSection = "";
    if (scannerRows) {
      scannerSection = `
        <h3 style="background:#f3f4f6; padding:10px; margin-top: 20px;">Scanner</h3>
        <table width="100%" cellspacing="0" style="font-size: 14px;">
          ${scannerRows}
        </table>
      `;
    }

    // --- Format Key Section ---
    let keySection = "";
    if (keyRows) {
      keySection = `
        <h3 style="background:#f3f4f6; padding:10px; margin-top: 20px;">Keys</h3>
        <table width="100%" cellspacing="0" style="font-size: 14px;">
          ${keyRows}
        </table>
      `;
    }

    // --- Format Med Returns ---
    let medReturnsSection = "";
    const medReturns = checklistObj["Med Returns"] as MedReturn | undefined;
    if (medReturns) {
        if (medReturns.hadReturns === 'Yes') {
            medReturnsSection = `
                <div style="margin: 20px 0; border: 1px solid #ea580c; border-radius: 8px; overflow: hidden;">
                    <h3 style="margin: 0; background: #ea580c; color: white; padding: 10px;">💊 Med Returns</h3>
                    <div style="padding: 15px; font-size: 14px;">
                        <p style="margin: 0 0 8px 0;"><strong>Reason:</strong> ${medReturns.reason || 'N/A'}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Facility/Nurse Station:</strong> ${medReturns.facilityPatient}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Handed to Pharmacy/Dropbox:</strong> ${medReturns.handedToPharmacy}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Require Refrigeration:</strong> ${medReturns.needsRefrigeration}</p>
                        ${medReturns.needsRefrigeration === 'Yes' ? `<p style="margin: 0; color: #2563eb; font-weight:bold;">Placed in Refrigerator: ${medReturns.placedInFridge}</p>` : ''}
                    </div>
                </div>
            `;
        } else {
            medReturnsSection = `
                <div style="margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <h3 style="margin: 0; background: #f3f4f6; padding: 10px;">💊 Med Returns</h3>
                    <div style="padding: 10px; font-size: 14px;"><strong>Had Returns:</strong> No</div>
                </div>
            `;
        }
    }

    // --- 2. Format Tackle Box Deliveries ---
    let tackleBoxSection = "";
    if (checklistObj["Tackle Boxes Included"]) {
      if (checklistObj["Tackle Boxes Included"] === "Yes" && Array.isArray(checklistObj["Tackle Box Deliveries"])) {
      const deliveries = checklistObj["Tackle Box Deliveries"] as Array<Record<string, unknown>>;
      const deliveryRows = deliveries.map(d => {
        let details = `<strong>Delivered:</strong> ${d.deliveredCount || 0}<br/>`;
        if (d.nurseEmptied === "Yes") {
          details += `<strong>Nurse Emptied:</strong> Yes (${d.emptiedReturnedCount || 0} returned)`;
        } else {
          details += `<span style="color:red;"><strong>Nurse Emptied:</strong> No</span><br/>`;
          details += `<strong>Returned to Pharmacy:</strong> ${d.returnedToPharmacy ? "Yes" : "No"} (${d.unemptiedReturnedCount || 0} count)<br/>`;
          details += `<strong>Meds Refrigerated:</strong> ${d.medsNeedRefrigeration === "Yes" ? `Yes (${d.medsMovedToFridge ? "Moved to Fridge" : "NOT MOVED"})` : "No"}`;
        }

        return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; vertical-align: top;"><strong>${d.location}</strong></td>
            <td style="padding: 10px; vertical-align: top; font-size: 13px;">${details}</td>
          </tr>
        `;
      }).join("");

      tackleBoxSection = `
        <div style="margin: 20px 0; border: 1px solid #1e3a8a; border-radius: 8px; overflow: hidden;">
          <h3 style="margin: 0; background: #1e3a8a; color: white; padding: 10px;">📦 Tackle Box Deliveries</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
            ${deliveryRows}
          </table>
        </div>
      `;
      } else {
        tackleBoxSection = `
          <div style="margin: 20px 0; border: 1px solid #1e3a8a; border-radius: 8px; overflow: hidden;">
            <h3 style="margin: 0; background: #1e3a8a; color: white; padding: 10px;">📦 Tackle Box Deliveries</h3>
            <div style="padding: 10px; font-size: 14px;">
              <strong>Tackle Boxes Included:</strong> ${checklistObj["Tackle Boxes Included"]}
            </div>
          </div>
        `;
      }
    }

    // --- 3. Format Tire Pressure ---
    let tireSection = "";
    if (checklistObj) {
       tireSection = `
         <div style="background:#f0f9ff; padding:15px; margin:20px 0; border-radius:8px;">
           <h3 style="margin-top:0; color:#004a8f;">Tire Pressure (PSI)</h3>
           <table width="100%" cellpadding="5">
             <tr>
               <td><strong>DF:</strong> ${checklistObj["Tire Pressure (Driver Front)"] || '-'}</td>
               <td><strong>PF:</strong> ${checklistObj["Tire Pressure (Passenger Front)"] || '-'}</td>
               <td><strong>DR:</strong> ${checklistObj["Tire Pressure (Driver Rear)"] || '-'}</td>
               <td><strong>PR:</strong> ${checklistObj["Tire Pressure (Passenger Rear)"] || '-'}</td>
             </tr>
           </table>
         </div>
       `;
    }

    // --- 3. Format Images ---
    const imageTitles: { [key: string]: string } = {
      front: "Front of Vehicle",
      driverSide: "Driver Side",
      rear: "Rear of Vehicle",
      passengerSide: "Passenger Side",
      driverFrontTire: "Driver Front Tire",
      passengerFrontTire: "Passenger Front Tire",
      driverRearTire: "Driver Rear Tire",
      passengerRearTire: "Passenger Rear Tire",
      frontSeat: "Front Seat Area",
      back: "Back Seat",
      trunk: "Trunk",
      };

      let exteriorImagesHtml = "";
      let tireImagesHtml = "";
      let interiorImagesHtml = "";

      if (images) {
      const exteriorKeys = ["front", "driverSide", "rear", "passengerSide"];
      const tireKeys = ["driverFrontTire", "passengerFrontTire", "driverRearTire", "passengerRearTire"];
      const interiorKeys = ["frontSeat", "back", "trunk"];


      const generateImageHtml = (keys: string[]) => {
        let html = '<div style="margin-top:10px;">';
        let count = 0;
        for (const key of keys) {
          if (images[key]) {
            html += `
              <div style="display: inline-block; width: 45%; min-width: 200px; margin-right: 10px; margin-bottom: 20px; vertical-align: top;">
                <p style="font-size:13px; font-weight:bold; margin-bottom:5px; color:#555;">${imageTitles[key] || key}</p>
                <a href="${images[key]}" target="_blank">
                  <img src="${images[key]}" style="width:100%; max-width: 280px; border-radius:6px; border:1px solid #ccc;" />
                </a>
              </div>
            `;
            count++;
          }
        }
        html += '</div>';
        return count > 0 ? html : "";
      }

      if (trip_type === 'Post-Trip') {
        exteriorImagesHtml = generateImageHtml(exteriorKeys);
        tireImagesHtml = generateImageHtml(tireKeys);
        interiorImagesHtml = generateImageHtml(interiorKeys);
      }
    }

    // --- 4. Format Share Link ---
    const shareSection = shareLink ? `
      <div style="margin: 30px 0; text-align: center; background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
        <p style="margin-bottom: 15px; font-weight: bold; color: #333;">View the full trip log online:</p>
        <a href="${shareLink}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">View Trip Log</a>
        <p style="margin-top: 15px; font-size: 12px; color: #666;">Or copy this link: <br/><a href="${shareLink}" style="color: #2563eb;">${shareLink}</a></p>
      </div>
    ` : '';

    // --- 5. Construct Email HTML ---
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">New Trip Log Submitted</h1>
        
        <table width="100%" style="margin-bottom: 20px;">
          <tr>
            <td><strong>Driver:</strong> ${driver_name}</td>
            <td style="text-align:right;"><strong>Date:</strong> ${new Date(created_at).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td><strong>Route:</strong> ${route_id || 'N/A'}</td>
            <td style="text-align:right;"><strong>Type:</strong> <span style="background:${trip_type === 'Pre-Trip' ? '#dbeafe' : '#fef3c7'}; padding:2px 6px; border-radius:4px;">${trip_type}</span></td>
          </tr>
          <tr>
            <td colspan="2"><strong>Odometer:</strong> ${odometer}</td>
          </tr>
        </table>

        ${shareSection}

        ${keySection}

        ${medReturnsSection}

        ${tackleBoxSection}

        ${tireSection}

        ${scannerSection}

        ${keySection}



        <h3 style="background:#f3f4f6; padding:10px;">Inspection Checklist</h3>
        <table width="100%" cellspacing="0" style="font-size: 14px;">
          <thead>
            <tr style="background:#e5e7eb;">
              <th style="text-align:left; padding:8px;">Item</th>
              <th style="text-align:left; padding:8px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${checklistRows}
          </tbody>
        </table>

        ${notes ? `<div style="margin-top:20px; background:#fffbeb; padding:15px; border:1px solid #fcd34d; border-radius:5px;"><strong>📝 Notes:</strong><br/>${notes}</div>` : ''}

        ${exteriorImagesHtml ? `
          <h3 style="background:#f3f4f6; padding:10px; margin-top: 20px;">Exterior Photos</h3>
          ${exteriorImagesHtml}
        ` : ''}

        ${tireImagesHtml ? `
          <h3 style="background:#f3f4f6; padding:10px; margin-top: 20px;">Tire Photos</h3>
          ${tireImagesHtml}
        ` : ''}

        ${interiorImagesHtml ? `
          <h3 style="background:#f3f4f6; padding:10px; margin-top: 20px;">Interior Photos</h3>
          ${interiorImagesHtml}
        ` : ''}
        
        <p style="margin-top:30px; font-size:12px; color:#999; text-align:center;">
          Automated message from Rx Delivery Logistics System.
        </p>
      </div>
    `;

    // --- 6. Send via Nodemailer ---
    
    // Configure Transporter using Environment Variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default or from env
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send Main Confirmation Email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Rx Delivery Logistics" <no-reply@rxdeliverylogistics.com>',
      to: 'idongesit_essien@ymail.com',
      subject: `Trip Log: ${driver_name} - ${trip_type} - ${new Date(created_at).toLocaleDateString()}`,
      html: emailHtml,
    });

    // --- 7. Check for Issues/Notes and Send Alert Email if needed ---
    const issueComments = Object.entries(checklistObj)
      .filter(([key]) => key.endsWith("_COMMENT"))
      .map(([key, val]) => {
        const question = key.replace("_COMMENT", "");
        return `<li><strong>${question}:</strong> ${val}</li>`;
      })
      .join("");

    if (notes || issueComments) {
      const alertHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 2px solid #dc2626; padding: 20px; border-radius: 10px;">
          <h1 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Alert 🚨: Driver Submitted Issue</h1>
          
          <p>An issue or additional note was reported by <strong>${driver_name}</strong> during a <strong>${trip_type}</strong>.</p>
          
          <table width="100%" style="margin: 20px 0; background: #fef2f2; padding: 15px; border-radius: 8px;">
            <tr>
              <td><strong>Driver:</strong> ${driver_name}</td>
              <td style="text-align:right;"><strong>Route:</strong> ${route_id || 'N/A'}</td>
            </tr>
          </table>

          ${notes ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #991b1b; margin-bottom: 5px;">📝 Additional Notes:</h3>
              <div style="background: #fffbeb; padding: 15px; border: 1px solid #fcd34d; border-radius: 5px; color: #92400e;">
                ${notes}
              </div>
            </div>
          ` : ''}

          ${issueComments ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #991b1b; margin-bottom: 5px;">⚠️ Reported Checklist Issues:</h3>
              <ul style="background: #fef2f2; padding: 15px 15px 15px 35px; border: 1px solid #fecaca; border-radius: 5px; color: #991b1b; margin: 0;">
                ${issueComments}
              </ul>
            </div>
          ` : ''}

          <div style="margin-top: 30px; text-align: center;">
            <a href="${shareLink}" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Review Full Trip Log</a>
          </div>

          <p style="margin-top:30px; font-size:12px; color:#999; text-align:center; border-top: 1px solid #eee; padding-top: 15px;">
            This is an automated priority alert from Rx Delivery Logistics System.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Rx Delivery Logistics Alerts" <no-reply@rxdeliverylogistics.com>',
        to: 'idongesit_essien@ymail.com',
        subject: `Alert 🚨: Driver Submitted Issue - ${driver_name}`,
        html: alertHtml,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}