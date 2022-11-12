
import { App, Modal, Setting, getAllTags, TFile } from "obsidian";

export class SummaryModal extends Modal {
    include: string;
    exclude: string;

    onSubmit: (include: string, exclude: string) => void;

    constructor(app: App, onSubmit: (include: string, exclude: string) => void) {
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

        // Get list of tags to exclude (Including the None option)
        const tagsToExclude = ["None"].concat(listTags);

        let { contentEl } = this;
        contentEl.createEl("h1", { text: "Add Summary" });

        if (listTags.length <= 0) {
            contentEl.setText("There are no tags in your notes");                
        } else {
            this.include = listTags[0];
            new Setting(contentEl)
                .setName("Select tag to include in the summary")
                .addDropdown((menu) => {                    
                    for (let i=0; i<listTags.length; i++) {
                        menu.addOption(listTags[i], listTags[i]);
                    }
                    menu.setValue(listTags[0]);
                    menu.onChange((value) => {
                        this.include = value;
                    }); 
                });

            this.exclude = tagsToExclude[0];
            new Setting(contentEl)
                .setName("Select tag to exclude from the summary")
                .addDropdown((menu) => {                    
                    for (let i=0; i<tagsToExclude.length; i++) {
                        menu.addOption(tagsToExclude[i], tagsToExclude[i]);
                    }
                    menu.setValue(tagsToExclude[0]);
                    menu.onChange((value) => {
                        this.exclude = value;
                    });
                });
            new Setting(contentEl)
                .addButton((button) => {
                    button
                    .setButtonText("Add Summary")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onSubmit(this.include, this.exclude);
                    });
                })
        }
    }
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

