// FILE: supabase/functions/notify-access-request/index.ts
// ROLE: System
// SECURITY: Uses Supabase service role for email sending
// SPRINT: 14A - Request Access Form
//
// DEPLOYMENT:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link project: supabase link --project-ref djuviwarqdvlbgcfuupa
// 4. Set secrets: supabase secrets set RESEND_API_KEY=re_xxxxx
// 5. Deploy: supabase functions deploy notify-access-request
//
// © 2026 Mission Meets Tech
// AI GENERATED - REQUIRES HUMAN REVIEW

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = 'maryadawson@gmail.com'
const FROM_EMAIL = 'MissionPulse <notifications@missionpulse.io>'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AccessRequest {
  request_id: string
  full_name: string
  email: string
  company_name: string
  job_title?: string
  phone?: string
  message?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload: AccessRequest = await req.json()
    console.log('[NotifyAccessRequest] Received:', payload.request_id)

    // Validate required fields
    if (!payload.full_name || !payload.email || !payload.company_name) {
      throw new Error('Missing required fields')
    }

    // Send admin notification email
    const adminEmailResult = await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🆕 New MissionPulse Access Request: ${payload.company_name}`,
      html: generateAdminEmailHtml(payload),
    })

    // Send confirmation to requester
    const userEmailResult = await sendEmail({
      to: payload.email,
      subject: 'Your MissionPulse Access Request',
      html: generateUserEmailHtml(payload),
    })

    console.log('[NotifyAccessRequest] Emails sent successfully')

    return new Response(
      JSON.stringify({
        success: true,
        admin_email: adminEmailResult,
        user_email: userEmailResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[NotifyAccessRequest] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Send email via Resend API
async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.warn('[NotifyAccessRequest] RESEND_API_KEY not set, skipping email')
    return { skipped: true, reason: 'No API key' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Resend API error: ${data.message || response.statusText}`)
  }

  return { sent: true, id: data.id }
}

// Generate HTML email for admin
function generateAdminEmailHtml(request: AccessRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0f1a; color: #ffffff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #00E5FA 0%, #0891b2 100%); padding: 20px 30px; }
    .header h1 { margin: 0; color: #000; font-size: 20px; }
    .content { padding: 30px; }
    .field { margin-bottom: 20px; }
    .field-label { color: #00E5FA; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .field-value { color: #ffffff; font-size: 16px; }
    .message-box { background: #0f172a; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .cta-button { display: inline-block; background: #00E5FA; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    .footer { padding: 20px 30px; background: #0f172a; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🆕 New Access Request</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${escapeHtml(request.full_name)}</div>
      </div>
      <div class="field">
        <div class="field-label">Company</div>
        <div class="field-value">${escapeHtml(request.company_name)}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${escapeHtml(request.email)}" style="color: #00E5FA;">${escapeHtml(request.email)}</a></div>
      </div>
      ${request.job_title ? `
      <div class="field">
        <div class="field-label">Job Title</div>
        <div class="field-value">${escapeHtml(request.job_title)}</div>
      </div>
      ` : ''}
      ${request.phone ? `
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${escapeHtml(request.phone)}</div>
      </div>
      ` : ''}
      ${request.message ? `
      <div class="message-box">
        <div class="field-label">Message</div>
        <div class="field-value" style="margin-top: 8px;">${escapeHtml(request.message)}</div>
      </div>
      ` : ''}
      <a href="https://missionpulse.netlify.app/admin-users.html" class="cta-button">View in Admin Panel →</a>
    </div>
    <div class="footer">
      MissionPulse by Mission Meets Tech<br>
      Request ID: ${request.request_id}
    </div>
  </div>
</body>
</html>
  `
}

// Generate HTML email for user
function generateUserEmailHtml(request: AccessRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0f1a; color: #ffffff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #00E5FA 0%, #0891b2 100%); padding: 30px; text-align: center; }
    .header h1 { margin: 0; color: #000; font-size: 24px; }
    .header p { margin: 10px 0 0; color: #000; opacity: 0.8; }
    .content { padding: 30px; }
    .content p { color: #cbd5e1; line-height: 1.6; margin-bottom: 20px; }
    .highlight { color: #00E5FA; font-weight: bold; }
    .steps { background: #0f172a; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .step { display: flex; align-items: flex-start; margin-bottom: 15px; }
    .step:last-child { margin-bottom: 0; }
    .step-number { background: #00E5FA; color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0; margin-right: 12px; }
    .step-text { color: #cbd5e1; }
    .footer { padding: 20px 30px; background: #0f172a; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Request Received</h1>
      <p>Thank you for your interest in MissionPulse</p>
    </div>
    <div class="content">
      <p>Hi <span class="highlight">${escapeHtml(request.full_name)}</span>,</p>
      <p>We've received your access request for MissionPulse, the AI-powered federal proposal management platform. Our team is reviewing your request and will be in touch within <span class="highlight">24-48 business hours</span>.</p>
      
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-text">Our team reviews your request</div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-text">We'll reach out to discuss your needs</div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-text">Get access to your MissionPulse workspace</div>
        </div>
      </div>
      
      <p>In the meantime, have questions? Reply to this email and we'll be happy to help.</p>
      
      <p style="margin-top: 30px;">
        Best regards,<br>
        <span class="highlight">The MissionPulse Team</span><br>
        Mission Meets Tech
      </p>
    </div>
    <div class="footer">
      © 2026 Mission Meets Tech. CMMC 2.0 Compliant.<br>
      <a href="https://missionpulse.io" style="color: #00E5FA;">missionpulse.io</a>
    </div>
  </div>
</body>
</html>
  `
}

// Escape HTML to prevent XSS
function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
