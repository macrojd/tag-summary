
import { App, Modal, Setting, getAllTags, TFile } from "obsidian";

export class SummaryModal extends Modal {
    result: string;
    onSubmit: (result: string) => void;

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        // Load tags
        let listTags: string[] = [];
        let listFiles = this.app.vault.getMarkdownFiles();
        listFiles.forEach((file) => {
            const cache = app.metadataCache.getFileCache(file);
            listTags = listTags.concat(getAllTags(cache));
        });
        // Remove duplicates and sort tags
        const tagsSet = new Set(listTags);
        listTags = Array.from(tagsSet).sort();

        let { contentEl } = this;
        contentEl.createEl("h1", { text: "Add Summary" });

        if (listTags.length <= 0) {
            contentEl.setText("There are no tags in your notes");                
        } else {
            this.result = listTags[0];
            new Setting(contentEl)
                .setName("Select tag to create the summary")
                .addDropdown((menu) => {                    
                    for (let i=0; i<listTags.length; i++) {
                        menu.addOption(listTags[i], listTags[i]);
                    }
                    menu.setValue(listTags[0]);
                    menu.onChange((value) => {
                        this.result = value;
                    });
                });
            new Setting(contentEl)
                .addButton((button) => {
                    button
                    .setButtonText("Add Summary")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onSubmit(this.result);
                    });
                })
        }
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

