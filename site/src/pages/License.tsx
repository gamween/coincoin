import { Section, Pill, PageHeader } from "../components/ui";
import { Footer } from "../sections/Footer";
import { GITHUB_URL, DOCS_URL } from "../data";

const MIT_TEXT = `MIT License

Copyright (c) 2026 coincoin (Sofiane)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export function License() {
  return (
    <>
      <PageHeader breadcrumb="license">
        <a href="/" className="font-body text-body-sm font-medium text-text-primary hover:text-info">
          ← Back to site
        </a>
        <a href={DOCS_URL} className="btn-ghost !px-5 !py-2.5">
          Docs
        </a>
      </PageHeader>

      <main className="relative z-10">
        <Section className="pt-16">
          <Pill tone="info" className="mb-5">LICENSE</Pill>
          <h1 className="display text-[clamp(34px,7vw,60px)] leading-[0.95] text-text-primary text-stroke">
            Open source, <span className="text-primary">MIT</span> licensed
          </h1>
          <p className="mt-6 max-w-2xl font-body text-body-lg text-text-muted">
            coincoin is released under the MIT License — free to use, copy, modify, and distribute.
            Built in the open for the Arbitrum Open House London buildathon.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Pill tone="safe">Permissive</Pill>
            <Pill tone="brand">Commercial use OK</Pill>
            <Pill tone="brand">Modification OK</Pill>
            <Pill tone="brand">Attribution required</Pill>
          </div>

          <div className="comic-card !shadow-bevel-lg mt-10 overflow-hidden">
            <div className="flex items-center gap-2 border-b-[3px] border-border bg-card px-5 py-2.5">
              <span className="h-3 w-3 rounded-full border-2 border-border bg-primary" />
              <span className="font-mono text-caption uppercase tracking-wide text-text-muted">LICENSE · MIT</span>
            </div>
            <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words p-6 font-mono text-body-sm leading-relaxed text-text-primary">
              {MIT_TEXT}
            </pre>
          </div>

          <p className="mt-6 font-body text-caption text-text-muted">
            Not legal advice. Testnet software, not audited.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="btn-comic">
              View LICENSE on GitHub
            </a>
            <a href="/" className="btn-ghost">← Back to site</a>
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}
