import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto-free rooms check...');

    // Get current time
    const now = new Date().toISOString();

    // Find all occupied rooms where occupied_till has passed
    const { data: expiredRooms, error: fetchError } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'occupied')
      .lt('occupied_till', now);

    if (fetchError) {
      console.error('Error fetching expired rooms:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredRooms?.length || 0} expired rooms`);

    if (expiredRooms && expiredRooms.length > 0) {
      // Free all expired rooms
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          status: 'free',
          allocated_to: null,
          subject: null,
          batch: null,
          teacher_name: null,
          occupied_from: null,
          occupied_till: null,
        })
        .eq('status', 'occupied')
        .lt('occupied_till', now);

      if (updateError) {
        console.error('Error updating rooms:', updateError);
        throw updateError;
      }

      console.log(`Successfully freed ${expiredRooms.length} rooms`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        freedRooms: expiredRooms?.length || 0,
        rooms: expiredRooms?.map(r => r.room_number) || [],
        timestamp: now,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in auto-free-rooms function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
