﻿// <copyright file="IGithubClientService.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System.Collections.Generic;
using System.Threading.Tasks;
using AppLensV3.Models;

namespace AppLensV3
{
    /// <summary>
    /// Interface for github client service.
    /// </summary>
    public interface IGithubClientService
    {
        /// <summary>
        /// Get raw file.
        /// </summary>
        /// <param name="url">The url.</param>
        /// <returns>Task for getting raw file.</returns>
        Task<string> GetRawFile(string url);

        /// <summary>
        /// Get source file.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting file.</returns>
        Task<string> GetSourceFile(string id);

        /// <summary>
        /// Get package configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting configuration.</returns>
        Task<string> GetConfiguration(string id);

        /// <summary>
        /// Get all commits.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting all commits.</returns>
        Task<List<Commit>> GetAllCommits(string id);

        /// <summary>
        /// Get commit content.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit content.</returns>
        Task<string> GetCommitContent(string id, string sha);

        /// <summary>
        /// Get commit configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit configuration.</returns>
        Task<string> GetCommitConfiguration(string id, string sha);
    }
}
