import { FC } from 'react';
import { Dispensary, Strain } from '@shared/schema';
import { ExternalLink, MapPin, Clock, Info, ShoppingCart } from 'lucide-react';

interface StoreCardProps {
  dispensary: Dispensary;
  selectedStrains: Strain[];
}

const StoreCard: FC<StoreCardProps> = ({ dispensary, selectedStrains }) => {
  const { 
    name, 
    address, 
    rating, 
    reviewCount, 
    distance, 
    openNow, 
    hours, 
    amenities, 
    imageUrl, 
    inventory 
  } = dispensary;

  // Find selected strains in dispensary inventory
  const selectedStrainsInventory = selectedStrains.map(strain => {
    const inventoryItem = inventory.find(item => item.strainId === strain.id);
    return {
      strain,
      inventoryItem
    };
  });

  // Generate rating stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        );
      }
    }
    return stars;
  };

  return (
    <div className="store-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-shrink-0">
            <img 
              src={imageUrl} 
              alt={`${name} storefront`} 
              className="w-full md:w-32 h-32 object-cover rounded-lg"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{name}</h4>
                <p className="text-sm text-gray-500">{address}</p>
                
                <div className="flex items-center mt-1 mb-2">
                  <div className="flex items-center">
                    {renderStars()}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">{rating.toFixed(1)} ({reviewCount} reviews)</span>
                </div>
              </div>
              
              <div className="mt-2 md:mt-0 md:text-right">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${openNow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} mb-1`}>
                  {openNow ? 'Open Now' : 'Closed'}
                </div>
                <p className="text-sm text-gray-500">{distance} miles away</p>
                <p className="text-sm text-gray-500">Hours: {hours}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap mt-3 gap-2">
              {amenities.map((amenity, index) => (
                <div 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {amenity}
                </div>
              ))}
            </div>
            
            {selectedStrains.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Your Selected Strains:</h5>
                <div className="flex flex-col md:flex-row gap-2 mb-3">
                  {selectedStrainsInventory.map(({ strain, inventoryItem }) => (
                    <div 
                      key={strain.id}
                      className={`flex-1 border ${inventoryItem?.inStock ? 'border-gray-200' : 'border-gray-200 bg-gray-100'} rounded-lg p-3`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{strain.name}</span>
                        {inventoryItem?.inStock ? (
                          <span className="text-sm font-bold text-gray-900">${inventoryItem.price.toFixed(2)}</span>
                        ) : (
                          <span className="text-sm text-gray-500">Out of stock</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{inventoryItem?.inStock ? inventoryItem.quantity : 'Not available'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-4">
              <a href="#" target="_blank" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Visit Website
              </a>
              <a href="#" target="_blank" className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition duration-150 ease-in-out">
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Order Now
              </a>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out">
                <Info className="h-4 w-4 mr-1.5" />
                More Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
