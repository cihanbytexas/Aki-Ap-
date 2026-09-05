import { AkinatorClient, Languages, Themes } from 'akinator-client'
import { randomUUID } from 'crypto'
import supabase from './supabase.js'

export default async function handler(req, res) {
if (req.method !== 'POST') {
return res.status(405).json({
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

    const languageMap = {
        TR: Languages.Turkish,
        EN: Languages.English
    }

    const selectedLanguage = languageMap[
        String(language).toUpperCase()
    ]

    if (!selectedLanguage) {
        return res.status(400).json({
            success: false,
            error: 'Desteklenen diller: TR, EN'
        })
    }

    const aki = new AkinatorClient({
        language: selectedLanguage,
        theme: Themes.Character
    })

    const result = await aki.start()

    const sessionId = randomUUID()

    const { error } = await supabase
        .from('akinator_sessions')
        .insert({
            id: sessionId,
            user_id: userId,
            session_data: aki.toJSON()
        })

    if (error) {
        throw error
    }

    return res.status(200).json({
        success: true,
        sessionId,
        userId,
        language: String(language).toUpperCase(),
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
