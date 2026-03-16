"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireSuperAdmin } from "@/lib/actions/_auth-guard";
import { revalidatePath } from "next/cache";

export async function createTicket(data: {
    subject: string;
    message: string;
    priority?: string;
}) {
    const { profile } = await requireAuth();
    if (!profile.restaurant_id) return { error: "لا يوجد مطعم مرتبط بحسابك" };

    const supabase = await createClient();
    const { error } = await supabase.from("support_tickets").insert({
        restaurant_id: profile.restaurant_id,
        subject: data.subject.trim(),
        message: data.message.trim(),
        priority: data.priority || "medium",
        status: "open",
    });

    if (error) return { error: error.message };
    revalidatePath("/dashboard/support");
    return { success: true };
}

export async function getRestaurantTickets() {
    const { profile } = await requireAuth();
    if (!profile.restaurant_id) return [];

    const supabase = await createClient();
    const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("restaurant_id", profile.restaurant_id)
        .order("created_at", { ascending: false });

    return data || [];
}

export async function getAllTickets(filters?: {
    status?: string;
    priority?: string;
}) {
    await requireSuperAdmin();
    const supabase = await createClient();

    let query = supabase
        .from("support_tickets")
        .select("*, restaurants(name, slug)")
        .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
    }
    if (filters?.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
    }

    const { data } = await query;
    return (data || []) as any[];
}

export async function replyToTicket(id: string, reply: string) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { error } = await supabase
        .from("support_tickets")
        .update({
            admin_reply: reply.trim(),
            replied_at: new Date().toISOString(),
            status: "in_progress",
        })
        .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/admin/support");
    return { success: true };
}

export async function updateTicketStatus(id: string, status: string) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/admin/support");
    return { success: true };
}

export async function getOpenTicketCount() {
    const supabase = await createClient();
    const { count } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
    return count || 0;
}
