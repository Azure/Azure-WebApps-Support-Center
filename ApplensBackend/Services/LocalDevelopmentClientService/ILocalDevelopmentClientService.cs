// <copyright file="ILocalDevelopmentClientService.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3
{
    /// <summary>
    /// Interface for local development client.
    /// </summary>
    public interface ILocalDevelopmentClientService
    {
        /// <summary>
        /// Prepare local development.
        /// </summary>
        /// <param name="detectorId">Detector id.</param>
        /// <param name="scriptBody">Script body.</param>
        /// <param name="resourceId">Resource id.</param>
        /// <param name="config">Package configuration.</param>
        /// <param name="baseUrl">Base URL.</param>
        /// <param name="gists">Gist list.</param>
        /// <param name="sourceReference">Source reference.</param>
        /// <returns>Task for preparing local development.</returns>
         Task<string> PrepareLocalDevelopment(string detectorId = null, string scriptBody = null, string resourceId = null, string config = null, Uri baseUrl = null, IDictionary<string, IEnumerable<string>> gists = null, IDictionary<string, Tuple<string, string>> sourceReference = null);
    }
}