import React from 'react';
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsLetterBox"

const about = () => {
  return (
    <div>

      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={"ABOUT"} text2={"US"} />
      </div>

      <div className="my-10 flex flex-col md:flex-row gap-16">
        <img className="w-full md:max-w-112.5" src={assets.about_img} alt="about-us" />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p>At Fluke Clothing, we believe great style should be effortless, versatile, and accessible. We bring together timeless fashion, modern trends, and everyday essentials designed for those who want to look and feel their best. From carefully selected pieces to fresh new arrivals, every product is chosen with a focus on quality, comfort, and contemporary style.</p>
          <p>We’re more than just a clothing store — we’re a place where style meets comfort and individuality. Whether you’re looking for everyday essentials or something to refresh your wardrobe, Fluke Clothing offers a collection that fits effortlessly into your lifestyle and helps you express your personal style with confidence.</p>
          <b className="text-gray-800">Our Mission</b>
          <p>Our goal is simple — to make fashion easy to discover, easy to wear, and worth coming back for. With Fluke Clothing, you can shop confidently knowing you’re getting styles made for modern living, without compromising on quality or value.</p>
        </div>
      </div>

      <div className="text-xl py-4">
        <Title text1={"WHY"} text2={"CHOOSE US"} />
      </div>

      <div className="flex flex-col md:flex-row text-sm mb-20">
        <div className="border px-10 md:px-16 py-8 md:py-20 flex flex-col gap-5">
          <b>Quality Assurance:</b>
          <p className="text-gray-600">We carefully select every product to ensure it meets our standards for quality, comfort, and durability. From fabric and stitching to the overall finish, we focus on providing clothing you can wear with confidence and enjoy for a long time.</p>
        </div>
        <div className="border px-10 md:px-16 py-8 md:py-20 flex flex-col gap-5">
          <b>Convenience:</b>
          <p className="text-gray-600">We make shopping simple, smooth, and hassle-free. Browse our collection anytime, explore the latest styles, and place your order from the comfort of your home. With an easy-to-use shopping experience, finding the right outfit has never been more convenient.</p>
        </div>
        <div className="border px-10 md:px-16 py-8 md:py-20 flex flex-col gap-5">
          <b>Our Customer Service:</b>
          <p className="text-gray-600">We’re committed to providing friendly and reliable customer service at every step. Whether you have a question about a product, need help with your order, or need assistance after your purchase, our team is always here to make your shopping experience as smooth and enjoyable as possible</p>
        </div>
      </div>

      <NewsletterBox />
      
    </div>
  );
};

export default about;
