import type { Schema, Struct } from '@strapi/strapi';

export interface SectionFaqList extends Struct.ComponentSchema {
  collectionName: 'components_section_faq_lists';
  info: {
    displayName: 'FAQ List';
  };
  attributes: {
    addFAQ: Schema.Attribute.Component<'shared.faq', true>;
    title: Schema.Attribute.String;
  };
}

export interface SharedFaq extends Struct.ComponentSchema {
  collectionName: 'components_shared_faqs';
  info: {
    displayName: 'FAQ';
    icon: 'manyWays';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'landscape';
  };
  attributes: {
    uploadImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedOpenGraph extends Struct.ComponentSchema {
  collectionName: 'components_shared_open_graphs';
  info: {
    displayName: 'openGraph';
    icon: 'project-diagram';
  };
  attributes: {
    ogDescription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
    ogTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    ogType: Schema.Attribute.String;
    ogUrl: Schema.Attribute.String;
  };
}

export interface SharedRichtexteditor extends Struct.ComponentSchema {
  collectionName: 'components_shared_richtexteditors';
  info: {
    displayName: 'richtexteditor';
    icon: 'book';
  };
  attributes: {
    fieldEditor: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'earth';
  };
  attributes: {
    excerpt: Schema.Attribute.Text;
    metaDescription: Schema.Attribute.Text;
    ogImage: Schema.Attribute.Media<'images', true>;
    seoTitle: Schema.Attribute.String;
  };
}

export interface SharedTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_shared_testimonials';
  info: {
    displayName: 'Testimonial';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.Text;
    designation: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'section.faq-list': SectionFaqList;
      'shared.faq': SharedFaq;
      'shared.media': SharedMedia;
      'shared.open-graph': SharedOpenGraph;
      'shared.richtexteditor': SharedRichtexteditor;
      'shared.seo': SharedSeo;
      'shared.testimonial': SharedTestimonial;
    }
  }
}
