const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
    res.json({ data: orders });
  }

  function bodyDataHas(propertyName) {
    return function validProperty(req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName] && data[propertyName] !== "") {
        return next();
      }
      next({
          status: 400,
          message: `Order must include ${propertyName}`
      });
    };
  }

  function dishesPropertyIsValid(req, res, next) {
    const {dishes} = req.body.data;
//     console.log("dishes", dishes)
    if (dishes.length === 0 || Array.isArray(dishes)===false) {
//     console.log("dishes array", dishes)
      return next({
      status: 400,
      message: "Order must include at least one dish"
      });
    }
    next ()
  }

  function orderExists(req, res, next) {
    const { orderId } = req.params;
    // console.log("orderId", orderId);
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder;
      return next();
    }
    next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  };

// update method status Propery
 function statusPropertyForUpdate(req, res, next) {
//       const  orderStatus  = res.locals.order.status; <-- this does not work -- orderStatus will always come back as pending -- need to ask why!
//       console.log("order status", orderStatus)
   	const { data: { status } = {} } = req.body;
   console.log("status", status)
	const validStatus = ["pending", "preparing", "out-for-delivery"];
   
	validStatus.includes(status)
		? next()
		: status === "delivered"
		? next({ status: 400, 
                message: "A delivered order cannot be changed" 
               })
		: next({
				status: 400,
				message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
		  });
}

// Status property for the delete method
  function statusPropertyIsValid(req, res, next) {
      const  orderStatus  = res.locals.order.status;
    //   console.log("order status", orderStatus)
      if (orderStatus !== "pending") {
          return next({
              status: 400,
              message: 'An order cannot be deleted unless it is pending.'
          })
      }
    next();
  }

// req.body id to match req.params -- when updating
function routeIdMatchesOrderId(req, res, next) {
  const { orderId } = req.params;
	const { data: { id } = {} } = req.body;
	if (id) {
		if (id === orderId) {
			return next();
		}

		return next({
			status: 400,
			message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
		});
	}
	next();
}

function dishQuantityIsValid(req, res, next) {
//     const {order} = req.body;
//     console.log("data", data)
  const {dishes} = req.body.data;
  console.log("dish", dishes)
//   console.log("dishes", dishes)
  dishes.forEach((dish) =>{
      if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity) || !dishes ){
          return next({
              status: 400,
              message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`
          });
      }
  })
  next();
}

  function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes={} } = {} } = req.body;
    const newOrder = {
      id: nextId(), // Increment last id then assign as the current ID
      deliverTo: deliverTo,
      mobileNumber: mobileNumber,
      dishes: dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  }
  
  function read(req, res, next) {
    res.json({ data: res.locals.order });
  };

  function update(req, res) {
    
    const foundOrder = res.locals.order;
    // console.log("this is foundOrder", foundOrder)
    // console.log("this is orderId", orderId)
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    // console.log("req body", req.body)
//     let foo = Object.assign(res.locals.order, req.body.data, { orderId })
  
    // update the order
    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.status = status;
    foundOrder.dishes = dishes;
  
    res.json({ data: foundOrder });
  }

  function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    // console.log("this is index", index)
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedOrders = orders.splice(index, 1);    
    res.sendStatus(204)
  }

  module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesPropertyIsValid,
        dishQuantityIsValid,
        create,
    ],
    list,
    update:[ 
        orderExists,
        routeIdMatchesOrderId,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesPropertyIsValid, 
        statusPropertyForUpdate,
        dishQuantityIsValid,
        update
    ],
    read:[ orderExists, read],
    delete:[ orderExists, statusPropertyIsValid, destroy],
    orderExists,
  }

// where does the previous step come from and where is it going next -- what is it looking for and how is it going through the pipeline
