import { AkinatorClient } from 'akinator-client'
import supabase from './supabase.js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed'
        })
    }

    try {
        const { userId, sessionId, answer } = req.body || {}

        if (!userId || !sessionId || answer === undefined) {
            return res.status(400).json({
                success: false,
                error: 'userId, sessionId ve answer gerekli'
            })
        }

        const { data, error } = await supabase
            .from('akinator_sessions')
            .select('session_data, user_id')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single()

        if (error || !data) {
            return res.status(404).json({
                success: false,
                error: 'Oturum bulunamadı'
            })
        }

        const aki = AkinatorClient.fromJSON(data.session_data)

        const result = await aki.answer(Number(answer))

        const { error: updateError } = await supabase
            .from('akinator_sessions')
            .update({
                session_data: aki.toJSON(),
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('user_id', userId)

        if (updateError) {
            throw updateError
        }

        return res.status(200).json({
            success: true,
            sessionId,
            userId,
            question: result.question,
            answers: result.answers,
            step: result.step,
            progression: result.progression,
            won: result.won || false,
            winResult: result.winResult || null
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}
