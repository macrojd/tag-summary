
import { Console } from 'console';
import { Editor, Plugin, MarkdownRenderer, getAllTags, TFile } from 'obsidian';
import { SummarySettingTab } from "./settings";
import { SummaryModal } from "./summarytags";

interface SummarySettings {
	includecallout: boolean;
	includelink: boolean;
	removetags: boolean;
	listparagraph: boolean;
 	includechildren: boolean;
}
const DEFAULT_SETTINGS: Partial<SummarySettings> = {
	includecallout: true,
	includelink: true,
	removetags: false,
	listparagraph: true,
 	includechildren: true,
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
				if (line.match(/^\s*tags:[\p{L}0-9_\-/# ]+$/gu)) {
					const content = line.replace(/^\s*tags:/, "").trim();

					// Get the list of valid tags and assign them to the tags variable
					let list = content.split(/\s+/).map((tag) => tag.trim());
					list = list.filter((tag) => {
						if (tag.match(/^#[\p{L}]+[^#]*$/u)) {
							return true;
						} else {
							return false;
						}
					});
					tags = list;
				}
				// Check if the line specifies the tags to include (AND)
				if (line.match(/^\s*include:[\p{L}0-9_\-/# ]+$/gu)) {
					const content = line.replace(/^\s*include:/, "").trim();

					// Get the list of valid tags and assign them to the include variable
					let list = content.split(/\s+/).map((tag) => tag.trim());
					list = list.filter((tag) => {
						if (tag.match(/^#[\p{L}]+[^#]*$/u)) {
							return true;
						} else {
							return false;
						}
					});
					include = list;
				}
				// Check if the line specifies the tags to exclude (NOT)
				if (line.match(/^\s*exclude:[\p{L}0-9_\-/# ]+$/gu)) {
					const content = line.replace(/^\s*exclude:/, "").trim();

					// Get the list of valid tags and assign them to the exclude variable
					let list = content.split(/\s+/).map((tag) => tag.trim());
					list = list.filter((tag) => {
						if (tag.match(/^#[\p{L}]+[^#]*$/u)) {
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
			// Remove files that do not contain the tags selected by the user
			const cache = app.metadataCache.getFileCache(file);
			const tagsInFile = getAllTags(cache);

			if (validTags.some((value) => tagsInFile.includes(value))) {
				return true;
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
		let listContents: [TFile, string][] = await this.readFiles(listFiles);

		// Create summary ttt
		let summary: string = "";
		listContents.forEach((item) => {
			// Get files name
			const fileName = item[0].name.replace(/.md$/g, "");
			const filePath = item[0].path;
			//const filePath2 = item[0].path;
			// Get paragraphs
			let listParagraphs: string[] = Array();
			const blocks = item[1].split(/\n\s*\n/).filter((row) => row.trim().length > 0);

			// Get list items
			blocks.forEach((paragraph) => {
				// Check if the paragraph is another plugin
				let valid = false;
				let listTags = paragraph.match(/#[\p{L}0-9_\-/#]+/gu);

				if (listTags != null && listTags.length > 0) {
					if (!paragraph.contains("```")) {
						valid = this.isValidText(listTags, tags, include, exclude);
					}
				}
				if (valid) {
					if (!this.settings.listparagraph) {
						// Add all paragraphs
						listParagraphs.push(paragraph);
					} else {
						// Add paragraphs and the items of a list
						let listItems: string[] = Array();
						let itemText = "";

						paragraph.split('\n\s*\n').forEach((line) => {
							let isList = false;
							isList = line.search(/(\s*[\-\+\*]){1}|([0-9]\.){1}\s+/) != -1
	
							if (!isList) {
								// Add normal paragraphs
								listParagraphs.push(line);
								itemText = "";
							} else {
								line.split('\n').forEach((itemLine) => {
									// Get the item's level
									let level = 0;
									const endIndex = itemLine.search(/[\-\+\*]{1}|([0-9]\.){1}\s+/);
									const tabText = itemLine.slice(0, endIndex);
									const tabs = tabText.match(/\t/g);
									if (tabs) {
										level = tabs.length;
									}
									// Get items tree
									if (level == 0) {
										if (itemText != "") {
											listItems.push(itemText);
											itemText = "";
										}
										itemText = itemText.concat(itemLine + "\n");
									} else if (this.settings.includechildren && level > 0 && itemText != "") {
										itemText = itemText.concat(itemLine + "\n");
									}
								});
							}
						});
						if (itemText != "") {
							listItems.push(itemText);
							itemText = "";
						}

						// Check tags on the items
						listItems.forEach((line) => {
							listTags = line.match(/#[\p{L}0-9_\-/#]+/gu);
							if (listTags != null && listTags.length > 0) {
								if (this.isValidText(listTags, tags, include, exclude)) {
									listParagraphs.push(line);
								}
							}
						});
 					}
				}
			})

			// Process each block of text
			listParagraphs.forEach((paragraph) => {
				// Restore newline at the end
				paragraph += "\n";
				var regex = new RegExp;
				//navigator.clipboard.writeText(paragraph);
				// Check which tag matches in this paragraph.
				var tagText = new String;
				var tagSection = null;
				tags.forEach((tag) => {
					tagText = tag.replace('#', '\\#');
					regex = new RegExp(`${tagText}(\\W|$)`, 'g');
              		if (paragraph.match(regex) != null) {
              			tagSection = tag
              		} 
            	});

				//paragraph += '```button\nname Copy to ' + tagSection.replace('#', '') + ' section\ntype command\naction QuickAdd: Paste Clipboard Text\n```'
				
				// Remove tags from blocks
				if (this.settings.removetags) {
					paragraph = paragraph.replace(/#[\p{L}0-9_\-/#]+/gu, "");
				}

				// Add link to original note
				if (this.settings.includelink) {
					//paragraph = "**Source:** [[" + filePath + "|" + fileName + "]]\n" + paragraph;
					let blockLink = paragraph.match(/\^[\p{L}0-9_\-/^]+/gu); 
            		if (blockLink) { paragraph = "> **[[" + filePath + "#" + blockLink + "|" + fileName + "]]**\n" + paragraph; }
            		else { paragraph = "> **[[" + filePath + "|" + fileName + "]]**\n" + paragraph; }
				}

				// Insert the text in a callout
				/*if (this.settings.includecallout) {
            		let callout = "> [!" + fileName + "]\n";
            		const rows = paragraph.split("\n");
            		rows.forEach((row) => {
              			callout += "> " + row + "\n";
            		});
            		paragraph = callout + "\n\n";
          		} else {*/
            	paragraph += "\n\n";
         		//}
          		summary += paragraph;
			});
		});

		// Add Summary
		if (summary != "") {
			let summaryContainer = createEl("div");
			summaryContainer.setAttribute('class', 'summary');
			await MarkdownRenderer.renderMarkdown(summary, summaryContainer, this.app.workspace.getActiveFile()?.path, null);
			element.replaceWith(summaryContainer);
		} else {
			this.createEmptySummary(element);
		}
	}

	// Read Files
	async readFiles(listFiles: TFile[]): Promise<[TFile, string][]> {
		let list: [TFile, string][] = [];
		for (let t = 0; t < listFiles.length; t += 1) {
			const file = listFiles[t];
			let content = await this.app.vault.cachedRead(file);
			list.push([file, content]);
		}
		return list;
	}

	// Check if tags are valid
	isValidText(listTags: string[], tags: string[], include: string[], exclude: string[]): boolean {
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

