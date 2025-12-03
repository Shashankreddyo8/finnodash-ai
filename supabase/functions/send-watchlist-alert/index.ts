import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  watchlistId: string;
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  targetPrice: number;
  alertType: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { watchlistId, stockSymbol, stockName, currentPrice, targetPrice, alertType, userEmail }: AlertRequest = await req.json();

    console.log(`Sending alert email for ${stockSymbol} to ${userEmail}`);

    const alertDirection = alertType === "above" ? "risen above" : "dropped below";
    const emoji = alertType === "above" ? "📈" : "📉";

    const emailResponse = await resend.emails.send({
      from: "FINNOLAN Alerts <onboarding@resend.dev>",
      to: [userEmail],
      subject: `${emoji} ${stockSymbol} Price Alert - Target Reached!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${emoji} Price Alert Triggered!</h1>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="margin-top: 0; color: #1a1a2e;">${stockName}</h2>
            <p style="font-size: 14px; color: #666; margin-bottom: 16px;">${stockSymbol}</p>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
              <div style="text-align: center; flex: 1;">
                <p style="font-size: 12px; color: #888; margin-bottom: 4px;">Current Price</p>
                <p style="font-size: 24px; font-weight: bold; color: #1a1a2e; margin: 0;">₹${currentPrice.toFixed(2)}</p>
              </div>
              <div style="text-align: center; flex: 1;">
                <p style="font-size: 12px; color: #888; margin-bottom: 4px;">Target Price</p>
                <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 0;">₹${targetPrice.toFixed(2)}</p>
              </div>
            </div>
            
            <p style="background: ${alertType === 'above' ? '#d4edda' : '#f8d7da'}; color: ${alertType === 'above' ? '#155724' : '#721c24'}; padding: 12px 16px; border-radius: 8px; margin: 0; text-align: center;">
              The price has ${alertDirection} your target of ₹${targetPrice.toFixed(2)}
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            This alert was sent from your FINNOLAN watchlist.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} FINNOLAN - Your AI Financial Assistant
          </p>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update the watchlist item to mark alert as sent
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from("watchlist")
      .update({ last_alert_sent: new Date().toISOString() })
      .eq("id", watchlistId);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-watchlist-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
