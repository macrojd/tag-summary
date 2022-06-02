
// Only tags
import { match } from 'assert';
import { Editor, Plugin, MarkdownRenderer, getAllTags } from 'obsidian';
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
				new SummaryModal(this.app, (include, exclude) => {
					// Format code block to add summary
					let summary = "```add-summary\n";

					// Add the tags label with the tag selected by the user
					summary += "tags: " + include + "\n";

					// Add the exclude label with the tags to exclude
					if (exclude != "None") {
						summary += "exclude: " + exclude + "\n";
					}
					summary += "```\n";
					editor.replaceRange(summary, editor.getCursor());
				}).open();
			},
		});

		// Post processor
		this.registerMarkdownCodeBlockProcessor("add-summary", async (source, el, ctx) => {
			// Initialize tag list
			let tags: string[] = Array();
			let include: string[] = Array();
			let exclude: string[] = Array();

			// Process rows inside codeblock
			const rows = source.split("\n").filter((row) => row.length > 0);
			rows.forEach((line) => {
				// Check if the line specifies the tags (OR)
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
				// Check if the line specifies the tags to include (AND)
				if (line.match(/^\s*include:[a-zA-Z0-9_\-/# ]+$/g)) {
					const content = line.replace(/^\s*include:/, "").trim();

					// Get the list of valid tags and assign them to the include variable
					let list = content.split(/\s+/).map((tag) => tag.trim());
					list = list.filter((tag) => {
						if (tag.match(/^#[a-zA-Z]+[^#]*$/)) {
							return true;
						} else {
							return false;
						}
					});
					include = list;
				}
				// Check if the line specifies the tags to exclude (NOT)
				if (line.match(/^\s*exclude:[a-zA-Z0-9_\-/# ]+$/g)) {
					const content = line.replace(/^\s*exclude:/, "").trim();

					// Get the list of valid tags and assign them to the exclude variable
					let list = content.split(/\s+/).map((tag) => tag.trim());
					list = list.filter((tag) => {
						if (tag.match(/^#[a-zA-Z]+[^#]*$/)) {
							return true;
						} else {
							return false;
						}
					});
					exclude = list;
				}
			});

			// Create summary only if the user specified some tags
			if (tags.length > 0 || include.length > 0) {
				await this.createSummary(el, tags, include, exclude, ctx.sourcePath);
			} else {
				this.createEmptySummary(el);
			}
		});  
	}
	// Show empty summary when the tags are not found
	createEmptySummary(element: HTMLElement) {
		const container = createEl("div");
		container.createEl("span", {
			attr: { style: 'color: var(--text-error) !important;' },
			text: "There are no blocks that match the specified tags." 
		});
		element.replaceWith(container);
	}
	// Load the blocks and create the summary
	async createSummary(element: HTMLElement, tags: string[], include: string[], exclude: string[], filePath: string) {
		const validTags = tags.concat(include); // All the tags selected by the user

		// Get files
		let listFiles = this.app.vault.getMarkdownFiles();

		// Filter files
		listFiles = listFiles.filter((file) => {
			// Do not process host file
			if (file.path != filePath) {
				// Remove files that do not contain the tags selected by the user
				const cache = app.metadataCache.getFileCache(file);
				const tagsInFile = getAllTags(cache);
				if (validTags.some((value) => tagsInFile.includes(value))) {
					return true;
				}
			}
			return false;
        });

		// Sort files alphabetically
		listFiles = listFiles.sort((file1, file2) => {
			if (file1.path < file2.path) {
				return -1;
			} else if (file1.path > file2.path) {
				return 1;
			} else {
				return 0;
			}
		});

		// Get files content
		const listContents = await Promise.all(
			listFiles.map(
				async (file) => [file, await app.vault.cachedRead(file)] as const,
			),
		);

		// Create summary
		let summary: string = "";
		listContents.forEach((item) => {
			// Get files name
			const fileName = item[0].name.replace(/.md$/g, "");
			const filePath = item[0].path;

			// Get process each block of text
			const block = item[1].split(/\n\s*\n/).filter((row) => row.trim().length > 0);
			block.forEach((paragraph) => {
				const listTags = paragraph.match(/#[a-zA-Z0-9_\-/#]+/g);
				const valid = this.isValid(listTags, tags, include, exclude);

				if (valid) {
					// Restore new line at the end
					paragraph += "\n";

					// Remove tags from blocks
					if (this.settings.removetags) {
						paragraph = paragraph.replace(/#[a-zA-Z0-9_\-/#]+/g, "");
					}

					// Add link to original note
					if (this.settings.includelink) {
						paragraph = "**Source:** [[" + filePath + "|" + fileName + "]]\n" + paragraph;
					}

					// Insert the text in a callout
					if (this.settings.includecallout) {
						// Insert the text in a callout box
						let callout = "> [!" + fileName + "]\n";
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
		if (summary != "") {
			let summaryContainer = createEl("div");
			await MarkdownRenderer.renderMarkdown(summary, summaryContainer, this.app.workspace.getActiveFile()?.path, null);
			element.replaceWith(summaryContainer);
		} else {
			this.createEmptySummary(element);
		}
	}

	// Check if tags are valid
	isValid(listTags: string[], tags: string[], include: string[], exclude: string[]): boolean {
		let valid = true;

		// Check OR (tags)
		if (tags.length > 0) {
			valid = valid && tags.some((value) => listTags.includes(value));
		}
		// Check AND (include)
		if (include.length > 0) {
			valid = valid && include.every((value) => listTags.includes(value));
		}
		// Check NOT (exclude)
		if (valid && exclude.length > 0) {
			valid = !exclude.some((value) => listTags.includes(value));
		}
		return valid;		
	}

	// Settings
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}	
}

