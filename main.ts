
// Only tags
import { Editor, Plugin, MarkdownRenderer } from 'obsidian';
import { SummarySettingTab } from "./settings";
import { SummaryModal } from "./summarytags";

interface SummarySettings {
	includecallout: boolean;
	includelink: boolean;
	removetags: boolean;
}
const DEFAULT_SETTINGS: Partial<SummarySettings> = {
	includecallout: true,
	includelink: true,
	removetags: false,
};
export default class SummaryPlugin extends Plugin {
	settings: SummarySettings;

	async onload() {
		// Prepare Settings
		await this.loadSettings();
		this.addSettingTab(new SummarySettingTab(this.app, this));

		// Create command to create a summary
		this.addCommand({
			id: "summary-modal",
			name: "Add Summary",
			editorCallback: (editor: Editor) => {
				new SummaryModal(this.app, (result) => {
					let summary = "```add-summary\n";
					summary += "tags: " + result + "\n";
					summary += "```\n";
					editor.replaceRange(summary, editor.getCursor());
				}).open();
			},
		});

		// Post processor
		this.registerMarkdownCodeBlockProcessor("add-summary", async (source, el, ctx) => {
			// Initialize tag list
			let tags: string[] = Array();

			// Process rows inside codeblock
			const rows = source.split("\n").filter((row) => row.length > 0);
			rows.forEach((line) => {
				// Check if the line specifies the tags
				if (line.match(/^\s*tags:[a-zA-Z0-9_\-/# ]+$/g)) {
					const content = line.replace(/^\s*tags:/, "").trim();

					// Get the list of valid tags and assign them to the tags variable
					let list = content.split(/\s+/).map((tag) => tag.trim());
					list = list.filter((tag) => {
						if (tag.match(/^#[a-zA-Z]+[^#]*$/)) {
							return true;
						} else {
							return false;
						}
					});
					tags = list;
				}
			});
			if (tags.length > 0) {
				await this.createSummary(el, tags, ctx.sourcePath);
			} else {
				await this.createEmptySummary(el);
			}
		});  
	}
	// Show empty summary when the tags are not found
	async createEmptySummary(element: HTMLElement) {
		const container = createEl("div");
		container.createEl("span", {
			attr: { style: 'color: var(--text-error) !important;' },
			text: "There are no blocks with the specified tags." 
		});
		element.replaceWith(container);
	}
	// Load the blocks and create the summary
	async createSummary(element: HTMLElement, tags: string[], filePath: string) {
		// Initialize regular expression to search for tags
		const exList = tags.map((tag) => {
			return "(" + tag + "([^a-zA-Z0-9_\\-#/]+|$))"
		});
		const tagsEx = exList.join("|");

		// Read files
		let listFiles = this.app.vault.getMarkdownFiles();

		// Remove host file and sort the files alphabetically
		listFiles = listFiles.filter((file) => file.path != filePath);
		listFiles = listFiles.sort((file1, file2) => {
			if (file1.path < file2.path) {
				return -1;
			} else if (file1.path > file2.path) {
				return 1;
			} else {
				return 0;
			}
		});

		// Get files contents and name (without extension)
		let listContents: [string, string][] = [];
		await listFiles.forEach(async (file) => {
			let name = file.name.replace(/.md$/g, "");
			let content = await this.app.vault.cachedRead(file);
			listContents.push([name, content]);
		});

		// Create summary
		let summary: string = "";
		listContents.forEach((item) => {
			const rows = item[1].split(/\n\s*\n/).filter((row) => row.trim().length > 0);
			rows.forEach((paragraph) => {
				let matchEx = new RegExp(tagsEx, "g");
				if (paragraph.match(matchEx)) {
					// Restore new line at the end
					paragraph += "\n";

					// Remove tags from blocks
					if (this.settings.removetags) {
						paragraph = paragraph.replace(/#[a-zA-Z0-9_\-/#]+/g, "");
					}

					// Add link to original note
					if (this.settings.includelink) {
						paragraph = "**Source:** [[" + item[0] + "]]\n" + paragraph;
					}

					// Insert the text in a callout
					if (this.settings.includecallout) {
						// Insert the text in a callout box
						let callout = "> [!" + item[0] + "]\n";
						const rows = paragraph.split("\n");
						rows.forEach((row) => {
							callout += "> " + row + "\n";
						});
						paragraph = callout + "\n\n";
					} else {
						// No Callout
						paragraph += "\n\n";
					}

					// Add to Summary
					summary += paragraph;
				}
			});
		});

		// Add Summary
		let summaryContainer = createEl("div");
		await MarkdownRenderer.renderMarkdown(summary, summaryContainer, null, null);
		element.replaceWith(summaryContainer);
	}

	// Settings
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}	
}

