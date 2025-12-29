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
      'shared.richtexteditor': SharedRichtexteditor;
      'shared.testimonial': SharedTestimonial;
    }
  }
}
