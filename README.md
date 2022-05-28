# Tag Summary

This is a plugin for [Obsidian](https://obsidian.md).

Tag Summary creates summaries with paragraphs or blocks of text that share the same tag. This plugin scans your files looking for blocks of text (text separated by empty lines) and creates a summary with all the blocks that contain the specified tag(s). For example, if you have the following paragraphs in your notes:

```
Monsters are real, and ghosts are real too. They live inside us, and sometimes, they win.
#chapter1
```

```
People think that I must be a very strange person. This is not correct. I have the heart of a small boy. It is in a glass jar on my desk.
#crazy
```

```
Great minds discuss ideas; average minds discuss events; small minds discuss people.
#chapter1
```

You can create summaries for the #chapter1 and #crazy tags. For instance, if you create a summary with the #chapter1 tag, the first and third paragraphs will be included, but if you create a summary with the #crazy tag, only the second paragraph will be included.

## Add a Summary to a Note

Summaries are added to a note by a code block with the add-summary identifier, and the tags are specified with the tags: label, as shown next.

\```add-summary

tags: #chapter1

\```

If you need to include blocks of texts with different tags, add the tags separated by a space, as shown next.

\```add-summary

tags: #chapter1 #crazy

\```

(The summary created by this last example would include the three paragraphs listed above)

## Command to Add a Summary

The plugin includes the Add Summary command to add a summary to a note.

- Open the note where you want to include the summary.
- Move the cursor to the position where you want to add the summary.
- Press Command+P (Mac) or Control+P (Windows) to open the Command palette. 
- Search for the Tag Summary: Add Summary command and click on it.
- On the popup window, select the tag you want to use to create the summary and press the Add Summary button.

Now your note should include a code block like the examples above. The Add Summary command allows you to select only one tag, but you can manually add all the tags you want separated by a space, as in tags: #chapter1 #chapter2.

## Summary Configuration

The plugin includes three options for configuration.

- Show Callouts: Shows each block of text inside a callout box (default). If disabled, the blocks are shown as plain text.
- Show Link: Includes a link to open the note where the paragraph was taken from.
- Remove Tags: Removes the original tags from the text.

## Usage

This plugin does not affect the way Obsidian, links, and tags work. You can still organize your notes the way you always do, but now you can assign a tag to a paragraph or a block of text and then create summaries with all the paragraphs in your notes that include that specific tag.

When structuring your notes, please consider the following:

- The plugin considers a block of text to be all the text between empty lines. If you add an empty line in the middle of a paragraph or a block of text, the plugin will consider that as two different blocks.
- Tags can be specified in any position of the paragraph or block of text, even in a new line at the end, as long as there are no empty lines in between.

## Safety

This plugin does not modify the original notes, it doesn't download or upload any information to the web, and doesn't store or retrieve any private information.

## Disclaimer

This plugin comes with no guarantee of any kind, and neither the author nor Obsidian are responsible for any loss of data or inconvenience.
Use this plugin at your own risk.

## From the Author

I've created this plugin for personal use. I will try to post updates once in a while. If you find a bug, you can contact me from my website:
[www.jdgauchat.com](https://www.jdgauchat.com/)

If you enjoy this plugin and want to support my work, you can buy me a coffee!

<a href="https://www.buymeacoffee.com/JDGauchat" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>


