import { AkinatorClient, Languages, Themes } from 'akinator-client'
import { randomUUID } from 'crypto'
import supabase from './supabase.js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        })
    }

    try {
        const { userId, language = 'TR' } = req.body || {}

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId gerekli'
            })
        }

        const lang = String(language).toUpperCase()

        const languageMap = {
            TR: Languages.Turkish,
            EN: Languages.English
        }

        const selectedLanguage = languageMap[lang]

        if (!selectedLanguage) {
            return res.status(400).json({
                success: false,
                error: 'Desteklenen diller: TR, EN'
            })
        }

        // Kullanıcının aktif oyunu var mı?
        const { data: existingSession, error: checkError } = await supabase
            .from('akinator_sessions')
            .select('id')
            .eq('user_id', userId)
            .limit(1)

        if (checkError) {
            throw checkError
        }

        if (existingSession && existingSession.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Bu kullanıcı zaten bir oyunda',
                sessionId: existingSession[0].id
            })
        }

        // Akinator oluştur
        const aki = new AkinatorClient({
            language: selectedLanguage,
            theme: Themes.Character
        })

        const result = await aki.start()

        const sessionId = randomUUID()

        // Session kaydet
        const { error: insertError } = await supabase
            .from('akinator_sessions')
            .insert({
                id: sessionId,
                user_id: userId,
                session_data: aki.toJSON()
            })

        if (insertError) {
            throw insertError
        }

        return res.status(200).json({
            success: true,
            sessionId,
            userId,
            language: lang,
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
