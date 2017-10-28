"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SpellSettings = require("./CSpellSettingsServer");
const defaultLocal = 'en';
const defaultLanguageSettings = [];
function getDefaultLanguageSettings() {
    return defaultLanguageSettings;
}
exports.getDefaultLanguageSettings = getDefaultLanguageSettings;
function stringToList(sList) {
    if (typeof sList === 'string') {
        sList = sList.replace(/\|/g, ',').replace(/\s/g, '').split(',');
    }
    return sList;
}
function normalizeLanguageId(langId) {
    const langIds = stringToList(langId);
    return new Set(langIds.map(a => a.toLowerCase()));
}
exports.normalizeLanguageId = normalizeLanguageId;
function normalizeLocal(local) {
    local = stringToList(local);
    return new Set(local.map(local => local.toLowerCase().replace(/[^a-z]/g, '')));
}
exports.normalizeLocal = normalizeLocal;
function isLocalInSet(local, setOfLocals) {
    const locals = normalizeLocal(local);
    return [...locals.values()].filter(local => setOfLocals.has(local)).length > 0;
}
exports.isLocalInSet = isLocalInSet;
function calcSettingsForLanguage(languageSettings, languageId, local) {
    languageId = languageId.toLowerCase();
    const allowedLocals = normalizeLocal(local);
    return defaultLanguageSettings.concat(languageSettings)
        .filter(s => !s.languageId || s.languageId === '*' || normalizeLanguageId(s.languageId).has(languageId))
        .filter(s => !s.local || s.local === '*' || isLocalInSet(s.local, allowedLocals))
        .map(langSetting => {
        const id = langSetting.local || langSetting.languageId || 'language';
        const s = Object.assign({ id }, langSetting);
        delete s.languageId;
        delete s.local;
        return s;
    })
        .reduce((langSetting, setting) => (Object.assign({}, SpellSettings.mergeSettings(langSetting, setting), { languageId,
        local })), {});
}
exports.calcSettingsForLanguage = calcSettingsForLanguage;
function calcUserSettingsForLanguage(settings, languageId) {
    const { languageSettings = [], language: local = defaultLocal } = settings;
    const defaults = {
        allowCompoundWords: settings.allowCompoundWords,
        enabled: settings.enabled,
    };
    const langSettings = Object.assign({}, defaults, calcSettingsForLanguage(languageSettings, languageId, local));
    return SpellSettings.mergeSettings(settings, langSettings);
}
exports.calcUserSettingsForLanguage = calcUserSettingsForLanguage;
function calcSettingsForLanguageId(baseSettings, languageId) {
    const langIds = ['*'].concat(languageId instanceof Array ? languageId : [languageId]);
    const langSettings = langIds.reduce((settings, languageId) => {
        return calcUserSettingsForLanguage(settings, languageId);
    }, baseSettings);
    return langSettings;
}
exports.calcSettingsForLanguageId = calcSettingsForLanguageId;
//# sourceMappingURL=LanguageSettings.js.map