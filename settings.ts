
import SummaryPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class SummarySettingTab extends PluginSettingTab {
    plugin: SummaryPlugin;

    constructor(app: App, plugin: SummaryPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
        .setName("Show Callouts")
        .setDesc("Show the text inside callout blocks")
        .addToggle((toggle) =>
            toggle
            .setValue(this.plugin.settings.includecallout)
            .onChange(async (value) => {
                this.plugin.settings.includecallout = value;
                await this.plugin.saveSettings();
            })
        );
        new Setting(containerEl)
        .setName("Show Link")
        .setDesc("Show link to original note")
        .addToggle((toggle) =>
            toggle
            .setValue(this.plugin.settings.includelink)
            .onChange(async (value) => {
                this.plugin.settings.includelink = value;
                await this.plugin.saveSettings();
            })
        );
        new Setting(containerEl)
        .setName("Remove Tags")
        .setDesc("Remove tags from text")
        .addToggle((toggle) =>
            toggle
            .setValue(this.plugin.settings.removetags)
            .onChange(async (value) => {
                this.plugin.settings.removetags = value;
                await this.plugin.saveSettings();
            })
        );

        new Setting(containerEl)
        .setName("List Items")
        .setDesc("Include only the items of a list that contain the tag, not the entire list.")
        .addToggle((toggle) =>
            toggle
            .setValue(this.plugin.settings.listparagraph)
            .onChange(async (value) => {
                this.plugin.settings.listparagraph = value;
                await this.plugin.saveSettings();
            })
        );
        new Setting(containerEl)
        .setName("Include Child Items")
        .setDesc("Include the child items of a list.")
        .addToggle((toggle) =>
            toggle
            .setValue(this.plugin.settings.includechildren)
            .onChange(async (value) => {
                this.plugin.settings.includechildren = value;
                await this.plugin.saveSettings();
            })
        );
    }
}

