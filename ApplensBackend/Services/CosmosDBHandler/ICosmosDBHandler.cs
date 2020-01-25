using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.Azure.Documents;

namespace AppLensV3.Services.CosmosDBHandler
{
    public interface ICosmosDBHandler<T> where T : class
    {
        Task<Document> CreateItemAsync(T item);
        Task<T> GetItemAsync(string id);
    }
}
