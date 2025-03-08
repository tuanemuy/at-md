import { InvalidMetadataError } from "../../errors/domain.ts";

/**
 * レンダリングオプションのテーマ
 */
export type ThemeOption = 'light' | 'dark' | 'auto';

/**
 * マークダウンのレンダリングオプションを表す値オブジェクト
 */
export class RenderingOptions {
  readonly theme: ThemeOption;
  readonly codeHighlighting: boolean;
  readonly tableOfContents: boolean;
  readonly syntaxHighlightingTheme: string;
  readonly renderMath: boolean;
  readonly renderDiagrams: boolean;

  /**
   * RenderingOptionsを作成する
   * 
   * @param params レンダリングオプションのパラメータ
   */
  constructor(params: {
    theme: ThemeOption;
    codeHighlighting: boolean;
    tableOfContents: boolean;
    syntaxHighlightingTheme: string;
    renderMath: boolean;
    renderDiagrams: boolean;
  }) {
    // テーマの検証
    if (!['light', 'dark', 'auto'].includes(params.theme)) {
      throw new InvalidMetadataError(
        "Invalid theme option. Must be 'light', 'dark', or 'auto'."
      );
    }

    this.theme = params.theme;
    this.codeHighlighting = params.codeHighlighting;
    this.tableOfContents = params.tableOfContents;
    this.syntaxHighlightingTheme = params.syntaxHighlightingTheme;
    this.renderMath = params.renderMath;
    this.renderDiagrams = params.renderDiagrams;

    // 不変性を保証するためにオブジェクトをフリーズする
    Object.freeze(this);
  }

  /**
   * デフォルトのレンダリングオプションを作成する
   * 
   * @returns デフォルトのRenderingOptions
   */
  static createDefault(): RenderingOptions {
    return new RenderingOptions({
      theme: 'auto',
      codeHighlighting: true,
      tableOfContents: true,
      syntaxHighlightingTheme: 'github',
      renderMath: false,
      renderDiagrams: false,
    });
  }

  /**
   * 新しいオプションで更新したRenderingOptionsを返す
   * 
   * @param params 更新するパラメータ
   * @returns 更新されたRenderingOptions
   */
  update(params: Partial<{
    theme: ThemeOption;
    codeHighlighting: boolean;
    tableOfContents: boolean;
    syntaxHighlightingTheme: string;
    renderMath: boolean;
    renderDiagrams: boolean;
  }>): RenderingOptions {
    return new RenderingOptions({
      theme: params.theme ?? this.theme,
      codeHighlighting: params.codeHighlighting ?? this.codeHighlighting,
      tableOfContents: params.tableOfContents ?? this.tableOfContents,
      syntaxHighlightingTheme: params.syntaxHighlightingTheme ?? this.syntaxHighlightingTheme,
      renderMath: params.renderMath ?? this.renderMath,
      renderDiagrams: params.renderDiagrams ?? this.renderDiagrams,
    });
  }

  /**
   * 値オブジェクトの等価性を比較する
   * 
   * @param other 比較対象のRenderingOptions
   * @returns 等しい場合はtrue、そうでない場合はfalse
   */
  equals(other: RenderingOptions): boolean {
    return (
      this.theme === other.theme &&
      this.codeHighlighting === other.codeHighlighting &&
      this.tableOfContents === other.tableOfContents &&
      this.syntaxHighlightingTheme === other.syntaxHighlightingTheme &&
      this.renderMath === other.renderMath &&
      this.renderDiagrams === other.renderDiagrams
    );
  }
} 