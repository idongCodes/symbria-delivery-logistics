import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json();
    const { 
      driver_name, 
      trip_type, 
      route_id, 
      odometer, 
      notes, 
      checklist, 
      images, 
      created_at 
    } = body;

    // --- 1. Format Checklist for Email ---
    // We'll convert the JSON checklist into HTML table rows
    let checklistRows = "";
    if (checklist) {
      Object.entries(checklist).forEach(([key, value]) => {
        if (key.endsWith("_COMMENT") || key.includes("Tire Pressure")) return; // Skip comments/tires for main list
        
        const commentKey = `${key}_COMMENT`;
        const comment = checklist[commentKey] ? `<br/><span style="color:red; font-size:12px;">⚠️ ${checklist[commentKey]}</span>` : "";
        
        // Style "No" or "Yes" (for damage) as bold/red if it's an issue
        // Assuming "No" is bad for safety checks, "Yes" is bad for damage checks
        const isDamageQ = key.includes("damage") || key.includes("Cracks");
        let statusStyle = "color:green; font-weight:bold;";
        
        if ((isDamageQ && value === "Yes") || (!isDamageQ && value === "No")) {
            statusStyle = "color:red; font-weight:bold;";
        }

        checklistRows += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${key}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; ${statusStyle}">${value} ${comment}</td>
          </tr>
        `;
      });
    }

    // --- 2. Format Tire Pressure (if Pre-Trip) ---
    let tireSection = "";
    if (trip_type === "Pre-Trip" && checklist) {
       tireSection = `
         <div style="background:#f0f9ff; padding:15px; margin:20px 0; border-radius:8px;">
           <h3 style="margin-top:0; color:#004a8f;">Tire Pressure (PSI)</h3>
           <table width="100%" cellpadding="5">
             <tr>
               <td><strong>DF:</strong> ${checklist["Tire Pressure (Driver Front)"] || '-'}</td>
               <td><strong>PF:</strong> ${checklist["Tire Pressure (Passenger Front)"] || '-'}</td>
               <td><strong>DR:</strong> ${checklist["Tire Pressure (Driver Rear)"] || '-'}</td>
               <td><strong>PR:</strong> ${checklist["Tire Pressure (Passenger Rear)"] || '-'}</td>
             </tr>
           </table>
         </div>
       `;
    }

    // --- 3. Format Images ---
    let imagesHtml = "";
    if (images) {
        imagesHtml = `<div style="display:flex; gap:10px; margin-top:20px;">`;
        if (images.front) imagesHtml += `<div style="flex:1;"><p style="font-size:12px; font-weight:bold;">Front Seat</p><img src="${images.front}" style="width:100%; max-width:200px; border-radius:5px; border:1px solid #ccc;" /></div>`;
        if (images.back) imagesHtml += `<div style="flex:1;"><p style="font-size:12px; font-weight:bold;">Back Seat</p><img src="${images.back}" style="width:100%; max-width:200px; border-radius:5px; border:1px solid #ccc;" /></div>`;
        if (images.trunk) imagesHtml += `<div style="flex:1;"><p style="font-size:12px; font-weight:bold;">Trunk</p><img src="${images.trunk}" style="width:100%; max-width:200px; border-radius:5px; border:1px solid #ccc;" /></div>`;
        imagesHtml += `</div>`;
    }

    // --- 4. Construct Email HTML ---
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

        ${tireSection}

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

        ${imagesHtml}
        
        <p style="margin-top:30px; font-size:12px; color:#999; text-align:center;">
          Automated message from Symbria Delivery Logistics System.
        </p>
      </div>
    `;

    // --- 5. Send via Resend ---
    const { data, error } = await resend.emails.send({
      from: 'Symbria Logistics <onboarding@resend.dev>', // Or your verified domain
      to: ['lholden@symbria.com'],
      bcc: ['ressien1@symbria.com', 'idongesit_essien@ymail.com'],
      subject: `Trip Log: ${driver_name} - ${trip_type} - ${new Date(created_at).toLocaleDateString()}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Email Error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}