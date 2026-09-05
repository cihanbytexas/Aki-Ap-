import { supabase } from "./supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Sadece POST destekleniyor"
    });
  }

  try {
    const { userId, sessionId } = req.body || {};

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: "userId ve sessionId gerekli"
      });
    }

    // Sadece bu kullanıcıya ait bu oyunu sil
    const { data, error } = await supabase
      .from("akinator_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select();

    if (error) {
      throw error;
    }

    // Böyle bir oyun yoksa
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Aktif oyun bulunamadı"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Oyun iptal edildi",
      sessionId,
      userId
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Oyun iptal edilirken hata oluştu"
    });
  }
}
