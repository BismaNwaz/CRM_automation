import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const today = new Date().toISOString().split("T")[0];

    // Get milestones due today
    const { data: dueTodayMilestones } = await supabase
      .from("milestones")
      .select("*, clients(name, phone)")
      .eq("deadline", today)
      .eq("status", "pending");

    // Get delayed milestones
    const { data: delayedMilestones } = await supabase
      .from("milestones")
      .select("*, clients(name, phone)")
      .eq("status", "delayed");

    const summary = {
      date: today,
      due_today: dueTodayMilestones?.length || 0,
      delayed: delayedMilestones?.length || 0,
      milestones_due: dueTodayMilestones || [],
      milestones_delayed: delayedMilestones || [],
    };

    console.log("Daily summary generated:", summary);

    return new Response(
      JSON.stringify({ success: true, summary }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in daily-summary:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
