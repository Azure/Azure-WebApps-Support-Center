using Diagnostics.Scripts;
using Diagnostics.Scripts.Models;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.IO;
using System.Text;
using Xunit;

namespace Diagnostics.Tests.ScriptsTests
{
    public class EntityInvokerTests
    {
        [Fact]
        public async void EntityInvoker_TestInvokeMethod()
        {
            using (EntityInvoker invoker = new EntityInvoker(ScriptTestDataHelper.GetRandomMetadata(), ImmutableArray.Create<string>()))
            {
                await invoker.InitializeEntryPointAsync();
                int result = (int)await invoker.Invoke(new object[] { 3 });
                Assert.Equal(9, result);
            }
        }

        [Theory]
        [InlineData(ScriptErrorType.CompilationError)]
        [InlineData(ScriptErrorType.DuplicateEntryPoint)]
        public async void EntityInvoker_TestInvokeWithCompilationError(ScriptErrorType errorType)
        {
            EntityMetadata metadata = ScriptTestDataHelper.GetRandomMetadata();
            metadata.scriptText = ScriptTestDataHelper.GetInvalidCsxScript(errorType);

            using (EntityInvoker invoker = new EntityInvoker(metadata, ImmutableArray.Create<string>()))
            {
                await Assert.ThrowsAsync<ScriptCompilationException>(async () =>
                {
                    await invoker.InitializeEntryPointAsync();
                    int result = (int)await invoker.Invoke(new object[] { 3 });
                    Assert.Equal(9, result);
                });
            }
        }

        [Fact]
        public async void EntityInvoker_TestInvokeWithNoEntryPoint()
        {
            EntityMetadata metadata = ScriptTestDataHelper.GetRandomMetadata();
            metadata.scriptText = ScriptTestDataHelper.GetInvalidCsxScript(ScriptErrorType.MissingEntryPoint);

            using (EntityInvoker invoker = new EntityInvoker(metadata, ImmutableArray.Create<string>()))
            {
                await Assert.ThrowsAsync<EntryPointNotFoundException>(async () =>
                {
                    await invoker.InitializeEntryPointAsync();
                    int result = (int)await invoker.Invoke(new object[] { 3 });
                    Assert.Equal(9, result);
                });
            }
        }

        [Fact(Skip = "Skipping this test until we have data sources project to inject a deendency dll in the script.")]
        public async void EntityInvoker_TestReferencesInjection()
        {
            EntityMetadata metadata = ScriptTestDataHelper.GetRandomMetadata();
            metadata.scriptText = ScriptTestDataHelper.GetScriptUsingNewtonSoft();
            string newtonSoftPath = Directory.GetCurrentDirectory() + "\\Newtonsoft.Json.dll";
            using (EntityInvoker invoker = new EntityInvoker(metadata, ImmutableArray.Create<string>(newtonSoftPath)))
            {
                Exception ex = await Record.ExceptionAsync(async () =>
                 {
                     await invoker.InitializeEntryPointAsync();
                     await invoker.Invoke(new object[] { });
                 });

                Assert.Null(ex);
                Assert.True(invoker.IsCompilationSuccessful);
            }
        }
    }
}
