const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: dishes })
};

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName] && data[propertyName] !== "") {
        return next();
      }
      next({
          status: 400,
          message: `Dish must include a ${propertyName}`
      });
    };
  }

  function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,

    });
  }

// req.body id to match req.params -- when updating
function routeIdMatchesDishId(req, res, next) {
  const { dishId } = req.params;
	const { data: { id } = {} } = req.body;
	if (id) {
		if (id === dishId) {
			return next();
		}

		return next({
			status: 400,
			message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
		});
	}
	next();
}

function priceIsValidNumber(req, res, next){
    const { data: { price }  = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        });
    }
    next();
  }

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
      id: nextId(), // Increment last id then assign as the current ID
      name: name,
      description: description,
      price: price,
      image_url: image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
  }

  function read(req, res) {
    const { dishId } = req.params;
//     const foundDish = dishes.find((dish) => dish.id === dishId);
    res.json({ data: res.locals.dish });
  }

  function update(req, res) {
    const {id} = res.locals.dish;
//     console.log("dish", dish)
    // console.log("this is foundDish", foundDish)
//     console.log("this is dish", dish)
//     const { data: { name, description, price, image_url } = {} } = req.body.data;
    // console.log("req body", req.body)
    let foo = Object.assign(res.locals.dish, req.body.data, { id });
// console.log("foo", foo)
  
    // update the dish
//     dish.name = name;
//     dish.description = description;
//     dish.price = price;
//     dish.image_url = image_url;
  
    res.json({ data: res.locals.dish });
  }

module.exports = {
    create:[
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        create,
    ],
    list,
    read:[ dishExists, read],
    update: [ 
        dishExists,
        routeIdMatchesDishId,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        update,
    ],
}