import { AkinatorClient } from 'akinator-client'
import supabase from './supabase.js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed'
        })
    }

    try {
        const { sessionId } = req.body || {}

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'sessionId gerekli'
            })
        }

        const { data, error } = await supabase
            .from('akinator_sessions')
            .select('session_data')
            .eq('id', sessionId)
            .single()

        if (error || !data) {
            return res.status(404).json({
                success: false,
                error: 'Oturum bulunamadı'
            })
        }

        const aki = AkinatorClient.fromJSON(data.session_data)

        if (!aki.won) {
            return res.status(400).json({
                success: false,
                error: 'Oyun henüz bitmedi'
            })
        }

        return res.status(200).json({
            success: true,
            result: aki.winResult || null
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}
