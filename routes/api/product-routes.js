const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {

  try {
  const prodData = await Product.findAll ({

    include: [
      {
        model: Category,
        as: 'category',
      },
      {
        model: Tag,
        through: ProductTag, 
        as: 'tags', 
      }
    ]
  })
  res.status(200).json(prodData);
} catch (err){
  res.status(500).json(err); 
}
});


// get one product
router.get('/:id', async (req, res) => {

  try {
    const singleProd = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category, 
          as: 'category',
        },
        {
          model: Tag, 
          through: ProductTag,
          as: 'tags'
        }
      ]
    })
    if (!singleProd) {
      res.status(404).json({ message: 'No product found with this id.'});
      return; 
    }
    res.status(200).json(singleProd);
  } catch (err) {
    res.status(500).json(err); 
  }
});

// create new product
router.post('/', async (req, res) => {

 try {
   const productData= await Product.create({
     product_name: req.body.product_name,
     price: req.body.price,
     stock: req.body.stock, 
     tagIds: req.body.tagIds, 
   })
    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: product.id,
          tag_id,
          };
        });
        let prodTag= ProductTag.bulkCreate(productTagIdArr);
        res.status(200).json(productTagIdArr);
      }else {
      res.status(200).json(productData);
      }
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    };
});

// update product
router.put('/:id', async (req, res) => {
  try {
  const productData = await Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
      // find all associated tags from ProductTag
      const productTags = ProductTag.findAll({ where: { product_id: req.params.id } });
      // get list of current tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      const updatedProductTags = await Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    res.json(updatedProductTags)
  } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }); 

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id
      }
    });
    if (!productData) {
      res.status(404).json ({message: 'No product found with this id.'})
      return; 
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err); 
  }
});

module.exports = router;
