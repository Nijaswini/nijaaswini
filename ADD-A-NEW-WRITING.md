# Adding a New Writing to NIJAASWINI

Follow this straightforward guide to add a new poem, reflection, or article to the website.

---

## Step 1: Open the Writings Data File

Open `data/writings.js` in your preferred editor (such as VS Code or Notepad).

Locate the `window.WRITINGS = [` array.

---

## Step 2: Add Your Entry

Add a new JavaScript object to the array. You can paste and edit this template:

```javascript
{
  id: "your-unique-slug",
  title: "Your Writing Title",
  category: "Poetry", // Options: "Poetry", "Reflections", or "Articles"
  date: "October 2026", // Optional date or ""
  order: 10,
  readTime: "2 min read",
  excerpt: "A short sentence introducing the essence of the piece.",
  image: "your-image.jpg", // Place in assets/images/
  imageAlt: "A description of the image for accessibility",
  body: `Your exact writing text goes here.

Separate stanzas or paragraphs with a single blank line.
Preserve exact line breaks, spelling, and punctuation.`,
  interpretation: {
    type: "author-approved",
    title: "The Meaning Behind the Words",
    kicker: "Behind the Lines",
    text: [
      "Explain the core emotional perspective or intended symbolism in clear, sensitive paragraphs.",
      "You can add multiple paragraphs here."
    ],
    reflectionPrompt: "A reflective question for readers to consider."
  }
}
```

---

## Step 3: Add an Optional Image

1. Place your visual image in the `assets/images/` directory.
2. Ensure the filename matches the `image` property in your data object.

---

## Step 4: Preview and Deploy

1. Save `data/writings.js`.
2. Open `index.html` locally to test your new writing card and reader dialog.
3. Drag and drop the `nijaaswini` folder to [Netlify Drop](https://app.netlify.com/drop) to publish your updates to the world.
