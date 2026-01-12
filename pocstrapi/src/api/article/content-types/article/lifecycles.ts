export default {
  beforeCreate(event) {
    console.log(`Before creating an article:`, event);
  },
  afterCreate(event) {
    console.log(`After creating an article:`, event);
  },
  beforeUpdate(event) {
    console.log(`Before updating an article:`, event);
  },
  afterUpdate(event) {
    console.log(`After updating an article:`, event);
  },
};
