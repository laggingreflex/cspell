import { expect } from 'chai';
import * as DefaultSettings from './DefaultSettings';

describe('Validate Default Settings', () => {
    test('test the static default settings', () => {
        const df = DefaultSettings._defaultSettings;
        expect(df.name).to.be.equal('Static Defaults');
    });

    test('tests the default setting file is loaded', () => {
        const defaultSetting = DefaultSettings.getDefaultSettings();
        expect(defaultSetting.name).to.be.equal('cspell default json');
    });
});
