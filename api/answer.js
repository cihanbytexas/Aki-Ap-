import { AkinatorClient } from 'akinator-client'
import supabase from './supabase.js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
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

        const answerNumber = Number(answer)

        if (
            !Number.isInteger(answerNumber) ||
            answerNumber < 0 ||
            answerNumber > 4
        ) {
            return res.status(400).json({
                success: false,
                error: 'answer 0 ile 4 arasında olmalı'
            })
        }

        // Session'ı userId + sessionId ile bul
        const { data, error } = await supabase
            .from('akinator_sessions')
            .select('session_data')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single()

        if (error || !data) {
            return res.status(404).json({
                success: false,
                error: 'Oturum bulunamadı veya bu kullanıcıya ait değil'
            })
        }

        const aki = AkinatorClient.fromJSON(data.session_data)

        let result

        /*
         * Normal durumda answer() çalışır.
         * Eğer Akinator zaten "gave up" durumundaysa
         * continue() ile oyunu devam ettirmeyi deniyoruz.
         */
        try {
            result = await aki.answer(answerNumber)
        } catch (error) {
            if (
                error.message &&
                error.message.toLowerCase().includes('already gave up')
            ) {
                result = await aki.continue()
            } else {
                throw error
            }
        }

        /*
         * Bazı durumlarda hata fırlatmak yerine
         * aki.ko true olabilir.
         */
        if (aki.ko) {
            result = await aki.continue()
        }

        /*
         * Akinator karakteri bildiyse
         * sonucu direkt bu API'den döndür.
         */
        if (aki.won || result.won) {
            const winResult = aki.winResult || null

            // Sonucu aldıktan sonra session'ı sil
            const { error: deleteError } = await supabase
                .from('akinator_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', userId)

            if (deleteError) {
                throw deleteError
            }

            return res.status(200).json({
                success: true,
                sessionId,
                userId,
                won: true,
                result: winResult
            })
        }

        /*
         * Oyun devam ediyorsa güncel session'ı kaydet.
         */
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
            won: false,
            question: result.question,
            answers: result.answers,
            step: result.step,
            progression: result.progression
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}
