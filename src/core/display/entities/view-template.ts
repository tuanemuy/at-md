/**
 * ビューテンプレートエンティティ
 * 
 * コンテンツの表示方法を定義するテンプレートを表します。
 */

import { DomainError, InvalidContentStateError } from "../../errors/mod.ts";

/**
 * テンプレートのレイアウトタイプ
 */
export type TemplateLayout = 'default' | 'blog' | 'portfolio' | 'custom';

/**
 * テンプレートのコンポーネント
 */
export type TemplateComponent = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

/**
 * ビューテンプレートエンティティ
 * 
 * ページの表示方法を定義するテンプレート
 */
export class ViewTemplate {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly layout: TemplateLayout;
  readonly components: TemplateComponent[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  /**
   * ViewTemplateエンティティを作成する
   * 
   * @param params テンプレートのパラメータ
   */
  constructor(params: {
    id: string;
    name: string;
    description?: string;
    layout: TemplateLayout;
    components: TemplateComponent[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    // 必須項目の検証
    if (!params.id) {
      throw new InvalidContentStateError("missing id", "create template");
    }
    if (!params.name) {
      throw new InvalidContentStateError("missing name", "create template");
    }
    if (!['default', 'blog', 'portfolio', 'custom'].includes(params.layout)) {
      throw new InvalidContentStateError(
        `invalid layout: ${params.layout}`,
        "create template"
      );
    }

    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.layout = params.layout;
    this.components = [...params.components]; // 配列のコピーを作成
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;

    // 不変性を保証するためにオブジェクトをフリーズする
    Object.freeze(this);
    Object.freeze(this.components);
  }

  /**
   * 名前を更新したViewTemplateを返す
   * 
   * @param name 新しい名前
   * @returns 更新されたViewTemplate
   */
  updateName(name: string): ViewTemplate {
    if (!name) {
      throw new InvalidContentStateError("missing name", "update name");
    }

    return new ViewTemplate({
      ...this,
      name,
      updatedAt: new Date(),
    });
  }

  /**
   * 説明を更新したViewTemplateを返す
   * 
   * @param description 新しい説明
   * @returns 更新されたViewTemplate
   */
  updateDescription(description?: string): ViewTemplate {
    return new ViewTemplate({
      ...this,
      description,
      updatedAt: new Date(),
    });
  }

  /**
   * レイアウトを変更したViewTemplateを返す
   * 
   * @param layout 新しいレイアウト
   * @returns 更新されたViewTemplate
   */
  changeLayout(layout: TemplateLayout): ViewTemplate {
    if (!['default', 'blog', 'portfolio', 'custom'].includes(layout)) {
      throw new InvalidContentStateError(
        `invalid layout: ${layout}`,
        "change layout"
      );
    }

    return new ViewTemplate({
      ...this,
      layout,
      updatedAt: new Date(),
    });
  }

  /**
   * コンポーネントを追加したViewTemplateを返す
   * 
   * @param component 追加するコンポーネント
   * @returns 更新されたViewTemplate
   */
  addComponent(component: TemplateComponent): ViewTemplate {
    if (!component.id) {
      throw new InvalidContentStateError("missing component id", "add component");
    }
    if (!component.type) {
      throw new InvalidContentStateError("missing component type", "add component");
    }

    // 既存のコンポーネントと新しいコンポーネントを結合
    const components = [...this.components, component];

    return new ViewTemplate({
      ...this,
      components,
      updatedAt: new Date(),
    });
  }

  /**
   * コンポーネントを削除したViewTemplateを返す
   * 
   * @param componentId 削除するコンポーネントのID
   * @returns 更新されたViewTemplate
   */
  removeComponent(componentId: string): ViewTemplate {
    if (!componentId) {
      throw new InvalidContentStateError("missing component id", "remove component");
    }

    // 指定されたIDのコンポーネントを除外
    const components = this.components.filter(c => c.id !== componentId);

    return new ViewTemplate({
      ...this,
      components,
      updatedAt: new Date(),
    });
  }

  /**
   * コンポーネントを更新したViewTemplateを返す
   * 
   * @param component 更新するコンポーネント
   * @returns 更新されたViewTemplate
   */
  updateComponent(component: TemplateComponent): ViewTemplate {
    if (!component.id) {
      throw new InvalidContentStateError("missing component id", "update component");
    }
    if (!component.type) {
      throw new InvalidContentStateError("missing component type", "update component");
    }

    // 指定されたIDのコンポーネントを更新
    const components = this.components.map(c => 
      c.id === component.id ? component : c
    );

    return new ViewTemplate({
      ...this,
      components,
      updatedAt: new Date(),
    });
  }
} 